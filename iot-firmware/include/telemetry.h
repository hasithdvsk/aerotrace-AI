#pragma once
#include <stdint.h>

/**
 * @brief 14-byte compact packed struct for LoRaWAN airtime efficiency
 * 
 * Layout:
 * - latitude:    int32_t (4 bytes) - Scaled by 10^6 (e.g. 28.631500 -> 28631500)
 * - longitude:   int32_t (4 bytes) - Scaled by 10^6 (e.g. 77.216700 -> 77216700)
 * - pm2_5:       uint16_t (2 bytes) - PM2.5 in µg/m³
 * - pm10:        uint16_t (2 bytes) - PM10 in µg/m³
 * - temperature: int8_t (1 byte)  - Temperature in °C (-40 to +85)
 * - humidity:    uint8_t (1 byte) - Relative Humidity in % (0 to 100)
 * Total: 4 + 4 + 2 + 2 + 1 + 1 = 14 bytes.
 */
struct __attribute__((packed)) TelemetryPayload {
    int32_t latitude;
    int32_t longitude;
    uint16_t pm2_5;
    uint16_t pm10;
    int8_t temperature;
    uint8_t humidity;
};

static_assert(sizeof(TelemetryPayload) == 14, "TelemetryPayload must be exactly 14 bytes");
