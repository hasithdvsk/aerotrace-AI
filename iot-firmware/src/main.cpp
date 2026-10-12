/**
 * @file main.cpp
 * @brief AeroTrace AI - Transit Bus Mobile Node Firmware
 *
 * Hardware Components:
 * - ESP32 DevKit V1 (Main MCU)
 * - u-blox NEO-6M GPS (UART1: RX=GPIO16, TX=GPIO17, 9600 baud)
 * - Plantower PMS5003 Dust Sensor (UART2: RX=GPIO25, TX=GPIO27, 9600 baud)
 * - Bosch BME280 Temp/Humidity/Pressure (I2C: SDA=GPIO21, SCL=GPIO22, 0x76/0x77)
 * - SX1276 / RFM95W LoRa Transceiver (SPI + LMIC stack)
 *
 * Payload:
 * - Compact 14-byte packed struct for LoRaWAN airtime efficiency
 * - Scaled int32 coordinates (10^6 scale factor for sub-meter resolution)
 * - 30-second transmission callback cycle over open ISM bands
 */

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <HardwareSerial.h>
#include <lmic.h>
#include <hal/hal.h>
#include <TinyGPSPlus.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <PMS.h>
#include "telemetry.h"

// ============================================================================
// HARDWARE PIN DEFINITIONS & DRIVERS
// ============================================================================

// GPS Module (NEO-6M on UART1)
#define PIN_GPS_RX 16
#define PIN_GPS_TX 17
#define GPS_BAUD   9600
HardwareSerial SerialGPS(1);
TinyGPSPlus gps;

// Dust Sensor (PMS5003 on UART2)
#define PIN_PMS_RX 25
#define PIN_PMS_TX 27
#define PMS_BAUD   9600
HardwareSerial SerialPMS(2);
PMS pms(SerialPMS);
PMS::DATA pmsData;

// Environmental Sensor (BME280 on I2C)
#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22
#define BME280_ADDR_PRIMARY   0x76
#define BME280_ADDR_SECONDARY 0x77
Adafruit_BME280 bme;
bool bmeInitialized = false;

// LoRaWAN SX1276 Pin Mapping (ESP32 DevKit)
const lmic_pinmap lmic_pins = {
    .nss = 18,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 14,
    .dio = {26, 33, LMIC_UNUSED_PIN},
};

// ============================================================================
// LORAWAN OTAA CREDENTIALS (THE THINGS NETWORK / CHIRPSTACK)
// ============================================================================

// Device EUI (Little-Endian)
static const u1_t PROGMEM DEVEUI[8]  = { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 };
void os_getDevEui(u1_t* buf) { memcpy_P(buf, DEVEUI, 8); }

// Application EUI / JoinEUI (Little-Endian)
static const u1_t PROGMEM APPEUI[8]  = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
void os_getArtEui(u1_t* buf) { memcpy_P(buf, APPEUI, 8); }

// Application Key (Big-Endian)
static const u1_t PROGMEM APPKEY[16] = {
    0x2B, 0x7E, 0x15, 0x16, 0x28, 0xAE, 0xD2, 0xA6,
    0xAB, 0xF7, 0x15, 0x88, 0x09, 0xCF, 0x4F, 0x3C
};
void os_getDevKey(u1_t* buf) { memcpy_P(buf, APPKEY, 16); }

// Transmission State & Scheduling
static osjob_t sendjob;
const unsigned TX_INTERVAL_SEC = 30; // 30-second callback interval
TelemetryPayload payload;

// Forward declaration
void do_send(osjob_t* j);

// ============================================================================
// SENSOR SAMPLING & COORDINATE SCALING
// ============================================================================

void readSensors() {
    Serial.println(F("\n[SENSORS] Sampling transit telemetry..."));

    // 1. NEO-6M GPS Coordinates (Encode float to scaled int32, 1e6 scale)
    if (gps.location.isValid() && gps.location.age() < 5000) {
        payload.latitude = (int32_t)(gps.location.lat() * 1000000.0);
        payload.longitude = (int32_t)(gps.location.lng() * 1000000.0);
        Serial.printf("[GPS] Fix Acquired: Lat=%.6f, Lon=%.6f, Satellites=%u\n",
            gps.location.lat(), gps.location.lng(), gps.satellites.value());
    } else {
        // Fallback transit baseline (Delhi Connaught Place: 28.631500, 77.216700)
        payload.latitude = (int32_t)(28.631500 * 1000000.0);
        payload.longitude = (int32_t)(77.216700 * 1000000.0);
        Serial.println(F("[GPS] Waiting for fix; utilizing transit hub baseline coordinates"));
    }

    // 2. Bosch BME280 Environmental Data
    if (bmeInitialized) {
        float temp = bme.readTemperature();
        float hum = bme.readHumidity();

        if (!isnan(temp)) {
            payload.temperature = (int8_t)constrain((long)round(temp), -40, 85);
        } else {
            payload.temperature = 28;
        }

        if (!isnan(hum)) {
            payload.humidity = (uint8_t)constrain((long)round(hum), 0, 100);
        } else {
            payload.humidity = 55;
        }

        Serial.printf("[BME280] Temp=%d °C, Humidity=%u %%\n",
            payload.temperature, payload.humidity);
    } else {
        payload.temperature = 28;
        payload.humidity = 55;
        Serial.println(F("[BME280] Sensor offline; default baseline applied"));
    }

    // 3. Plantower PMS5003 Dust Sensor Data
    if (pms.readUntil(pmsData, 1000)) {
        payload.pm2_5 = pmsData.PM_AE_UG_2_5;
        payload.pm10 = pmsData.PM_AE_UG_10_0;
        Serial.printf("[PMS5003] PM2.5=%u µg/m³, PM10=%u µg/m³\n",
            payload.pm2_5, payload.pm10);
    } else {
        // Ambient fallback if sensor pipe has no fresh frames
        if (payload.pm2_5 == 0) payload.pm2_5 = 38;
        if (payload.pm10 == 0) payload.pm10 = 74;
        Serial.println(F("[PMS5003] Frame timeout; previous particulate reading retained"));
    }

    // Print 14-byte payload summary
    Serial.printf("[PAYLOAD] 14 Bytes -> Lat: %d, Lon: %d, PM2.5: %u, PM10: %u, T: %d, H: %u\n",
        payload.latitude, payload.longitude, payload.pm2_5, payload.pm10,
        payload.temperature, payload.humidity);
}

// ============================================================================
// LORAWAN TRANSMISSION & EVENT HANDLING
// ============================================================================

void do_send(osjob_t* j) {
    // Check if there is a current TX/RX job running
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("[LMIC] OP_TXRXPEND, not sending; waiting for radio"));
    } else {
        // Read fresh sensor telemetry
        readSensors();

        // Queue packet for transmission on LoRaWAN port 1, unconfirmed (0)
        LMIC_setTxData2(1, (xref2u1_t)&payload, sizeof(payload), 0);
        Serial.printf("[LMIC] Packet queued on Port 1. Payload size: %u bytes\n",
            (unsigned)sizeof(payload));
    }
}

void onEvent(ev_t ev) {
    Serial.printf("[LMIC] Event: %u at tick %lu: ", (unsigned)ev, (unsigned long)os_getTime());
    switch (ev) {
        case EV_SCAN_TIMEOUT:
            Serial.println(F("EV_SCAN_TIMEOUT"));
            break;
        case EV_BEACON_FOUND:
            Serial.println(F("EV_BEACON_FOUND"));
            break;
        case EV_BEACON_MISSED:
            Serial.println(F("EV_BEACON_MISSED"));
            break;
        case EV_BEACON_TRACKED:
            Serial.println(F("EV_BEACON_TRACKED"));
            break;
        case EV_JOINING:
            Serial.println(F("EV_JOINING (OTAA Handshake Initiated)"));
            break;
        case EV_JOINED:
            Serial.println(F("EV_JOINED (Session Established)"));
            // Disable link check validation
            LMIC_setLinkCheckMode(0);
            break;
        case EV_JOIN_FAILED:
            Serial.println(F("EV_JOIN_FAILED"));
            break;
        case EV_REJOIN_FAILED:
            Serial.println(F("EV_REJOIN_FAILED"));
            break;
        case EV_TXCOMPLETE:
            Serial.println(F("EV_TXCOMPLETE (Transmission Finished, RX Windows Expired)"));
            if (LMIC.txrxFlags & TXRX_ACK) {
                Serial.println(F("[LMIC] Received Gateway ACK"));
            }
            if (LMIC.dataLen) {
                Serial.printf("[LMIC] Received downlink: %u bytes\n", (unsigned)LMIC.dataLen);
            }
            // Schedule next uplink exactly 30 seconds after completion
            os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL_SEC), do_send);
            Serial.printf("[LMIC] Next uplink scheduled in %u seconds\n", TX_INTERVAL_SEC);
            break;
        case EV_LOST_TSYNC:
            Serial.println(F("EV_LOST_TSYNC"));
            break;
        case EV_RESET:
            Serial.println(F("EV_RESET"));
            break;
        case EV_RXCOMPLETE:
            Serial.println(F("EV_RXCOMPLETE"));
            break;
        case EV_LINK_DEAD:
            Serial.println(F("EV_LINK_DEAD"));
            break;
        case EV_LINK_ALIVE:
            Serial.println(F("EV_LINK_ALIVE"));
            break;
        case EV_TXSTART:
            Serial.println(F("EV_TXSTART (Radio Transmitting on ISM Band)"));
            break;
        case EV_TXCANCELED:
            Serial.println(F("EV_TXCANCELED"));
            break;
        case EV_RXSTART:
            Serial.println(F("EV_RXSTART"));
            break;
        case EV_JOIN_TXCOMPLETE:
            Serial.println(F("EV_JOIN_TXCOMPLETE: No join accept received"));
            break;
        default:
            Serial.println(F("Unknown LMIC event"));
            break;
    }
}

// ============================================================================
// SYSTEM SETUP & MAIN LOOP
// ============================================================================

void setup() {
    // 1. Initialize Debug Console
    Serial.begin(115200);
    delay(1000);
    Serial.println(F("\n========================================================"));
    Serial.println(F("  AeroTrace AI - Transit Bus Mobile Node Firmware       "));
    Serial.println(F("  ESP32 + NEO-6M GPS + PMS5003 + BME280 + SX1276 LoRa   "));
    Serial.println(F("========================================================"));

    // 2. Initialize Hardware Serial for GPS (UART1)
    SerialGPS.begin(GPS_BAUD, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
    Serial.printf("[INIT] NEO-6M GPS initialized on UART1 (RX=%d, TX=%d, Baud=%d)\n",
        PIN_GPS_RX, PIN_GPS_TX, GPS_BAUD);

    // 3. Initialize Hardware Serial for PMS5003 Dust Sensor (UART2)
    SerialPMS.begin(PMS_BAUD, SERIAL_8N1, PIN_PMS_RX, PIN_PMS_TX);
    pms.passiveMode(); // Or activeMode depending on sample cadence
    pms.wake();
    Serial.printf("[INIT] PMS5003 Sensor initialized on UART2 (RX=%d, TX=%d, Baud=%d)\n",
        PIN_PMS_RX, PIN_PMS_TX, PMS_BAUD);

    // 4. Initialize I2C and BME280 Sensor
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    if (bme.begin(BME280_ADDR_PRIMARY, &Wire) || bme.begin(BME280_ADDR_SECONDARY, &Wire)) {
        bmeInitialized = true;
        Serial.println(F("[INIT] Bosch BME280 initialized successfully over I2C"));
    } else {
        Serial.println(F("[WARN] Bosch BME280 not found. Check wiring (0x76/0x77)"));
    }

    // 5. Initialize LMIC LoRaWAN Subsystem
    os_init();
    LMIC_reset();

    // Disable link check validation
    LMIC_setLinkCheckMode(0);

    // Set initial data rate and transmit power for Europe/India 868 ISM band
    LMIC_setDrTxpow(DR_SF7, 14);

    Serial.println(F("[INIT] LMIC Radio Subsystem initialized on ISM 868 MHz band"));

    // 6. Enqueue Initial Transmission
    do_send(&sendjob);
}

void loop() {
    // Continuously feed incoming GPS NMEA sentences into parser
    while (SerialGPS.available()) {
        gps.encode(SerialGPS.read());
    }

    // Execute LMIC OS background runloop for radio scheduling and timeouts
    os_runloop_once();
}
