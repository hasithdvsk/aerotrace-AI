# AeroTrace AI - Transit Bus Mobile Node Firmware

Embedded IoT edge firmware for city transit buses operating as high-resolution mobile air quality mesh nodes. Built on ESP32 DevKit using PlatformIO with real-time sensor sampling, coordinate scaling, and long-range LoRaWAN telemetry transmission.

---

## Hardware Architecture & Pin Mapping

| Peripheral | Component | Protocol / Bus | ESP32 Pins | Baud / Frequency |
| :--- | :--- | :--- | :--- | :--- |
| **GPS** | u-blox NEO-6M | HardwareSerial (UART1) | `RX=GPIO16`, `TX=GPIO17` | 9600 bps |
| **Dust / Particulate** | Plantower PMS5003 | HardwareSerial (UART2) | `RX=GPIO25`, `TX=GPIO27` | 9600 bps |
| **Environmental** | Bosch BME280 | I2C (Wire) | `SDA=GPIO21`, `SCL=GPIO22` | I2C Address `0x76` / `0x77` |
| **LoRa Transceiver** | SX1276 / RFM95W | SPI + LMIC DIO Pins | `NSS=18`, `RST=14`, `DIO0=26`, `DIO1=33` | 868 MHz / SF7 / 14 dBm |

---

## 14-Byte Compact LoRaWAN Payload

To respect LoRaWAN Fair Access Policies and open ISM band duty-cycle limitations, telemetry is packed into a strictly aligned 14-byte binary struct:

```cpp
struct __attribute__((packed)) TelemetryPayload {
    int32_t latitude;     // 4 bytes: Scaled latitude (degrees * 1e6, e.g. 28.631500 -> 28631500)
    int32_t longitude;    // 4 bytes: Scaled longitude (degrees * 1e6, e.g. 77.216700 -> 77216700)
    uint16_t pm2_5;       // 2 bytes: PM2.5 in µg/m³ (0 - 65,535)
    uint16_t pm10;        // 2 bytes: PM10 in µg/m³ (0 - 65,535)
    int8_t temperature;   // 1 byte:  Ambient Temperature in °C (-40 to +85)
    uint8_t humidity;     // 1 byte:  Relative Humidity in % (0 - 100)
};
```

- **Total Payload Size:** `14 bytes` (`sizeof(TelemetryPayload) == 14`)
- **Radio Airtime:** ~`51.5 ms` at SF7BW125
- **Transmission Cadence:** 30 seconds (`TX_INTERVAL_SEC = 30`)

---

## Workspace Structure

```
iot-firmware/
├── platformio.ini       # PlatformIO configuration (esp32dev, MCCI LMIC, PMS, BME280, TinyGPSPlus)
├── src/
│   └── main.cpp         # Hardware drivers, sensor sampling loop, LMIC OS stack & event handlers
├── include/
│   ├── telemetry.h      # Packed 14-byte TelemetryPayload struct
│   └── README
└── lib/
    └── README
```

---

## Compilation & Flashing

```bash
cd iot-firmware

# Compile firmware
pio run
# or: python -m platformio run

# Flash to connected ESP32
pio run --target upload

# Open Serial Monitor
pio device monitor -b 115200
```
