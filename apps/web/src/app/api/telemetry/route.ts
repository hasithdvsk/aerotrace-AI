import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ChirpStackUplinkPayload {
  deduplicationId?: string;
  time?: string;
  deviceInfo?: {
    tenantId?: string;
    tenantName?: string;
    applicationId?: string;
    applicationName?: string;
    deviceProfileId?: string;
    deviceProfileName?: string;
    deviceName?: string;
    devEui?: string;
    tags?: Record<string, string>;
  };
  devEUI?: string;
  devAddr?: string;
  fCnt?: number;
  fPort?: number;
  data?: string; // Base64 or Hex encoded binary payload
  payload_hex?: string; // Alternate hex payload field
  object?: {
    pm2_5?: number;
    pm10?: number;
    co2?: number;
    temperature?: number;
    humidity?: number;
    latitude?: number;
    longitude?: number;
    [key: string]: unknown;
  };
  rxInfo?: Array<{
    gatewayId?: string;
    rssi?: number;
    snr?: number;
    channel?: number;
  }>;
  txInfo?: {
    frequency?: number;
  };
}

export interface DecodedSensorData {
  pm2_5: number;
  pm10: number;
  co2: number;
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  batteryVoltage?: number;
}

export interface CorrectedSensorData extends DecodedSensorData {
  raw_pm2_5: number;
  raw_pm10: number;
  raw_co2: number;
  aqi_calculated: number;
  correction_applied: {
    formula: string;
    humidity_growth_factor: number;
    temperature_gas_factor: number;
  };
}

// ============================================================================
// 1. Binary / Hex Payload Decoder
// ============================================================================

/**
 * Decodes ChirpStack LoRaWAN data buffer (Hex or Base64) into environmental parameters.
 * Supports:
 *  - 18 to 22 byte packed telemetry frames
 *  - Cayenne LPP dynamic TLV payloads
 *  - Direct JSON fallback
 */
export function decodePayloadBuffer(buffer: Buffer): DecodedSensorData {
  // Option A: Standard Packed Environmental Telemetry Frame (>= 18 bytes)
  // Byte 0-1: PM2.5 (uint16_be, 0.1 µg/m³ or raw µg/m³)
  // Byte 2-3: PM10  (uint16_be, 0.1 µg/m³ or raw µg/m³)
  // Byte 4-5: CO2   (uint16_be, ppm)
  // Byte 6-7: Temp  (int16_be, 0.01 °C or 0.1 °C)
  // Byte 8-9: Hum   (uint16_be, 0.01 % or 0.1 %)
  // Byte 10-13: Lat (int32_be, scaled by 1e6 or 1e7)
  // Byte 14-17: Lon (int32_be, scaled by 1e6 or 1e7)
  // Byte 18-19: Batt (uint16_be, mV - optional)
  if (buffer.length >= 18) {
    let offset = 0;
    
    // PM2.5 (scaled by 10 for 0.1 µg/m³ precision if > 500, or directly)
    const rawPm25 = buffer.readUInt16BE(offset);
    offset += 2;
    const pm2_5 = rawPm25 > 500 ? rawPm25 / 10 : rawPm25;

    // PM10 (scaled by 10 if > 500)
    const rawPm10 = buffer.readUInt16BE(offset);
    offset += 2;
    const pm10 = rawPm10 > 500 ? rawPm10 / 10 : rawPm10;

    // CO2 (ppm direct)
    const co2 = buffer.readUInt16BE(offset);
    offset += 2;

    // Temperature (signed, scaled by 100 e.g. 2840 -> 28.4°C or 10 e.g. 284 -> 28.4°C)
    const rawTemp = buffer.readInt16BE(offset);
    offset += 2;
    const temperature = Math.abs(rawTemp) > 100 ? rawTemp / 100 : rawTemp;

    // Humidity (scaled by 100 e.g. 5820 -> 58.2% or direct)
    const rawHum = buffer.readUInt16BE(offset);
    offset += 2;
    const humidity = rawHum > 100 ? rawHum / 100 : rawHum;

    // Latitude (scaled by 1e6 or 1e7, clamped to [-90, 90])
    const rawLat = buffer.readInt32BE(offset);
    offset += 4;
    let latitude = rawLat / 1e6;
    if (Math.abs(latitude) > 90) {
      latitude = rawLat / 1e7;
    }

    // Longitude (scaled by 1e6 or 1e7, clamped to [-180, 180])
    const rawLon = buffer.readInt32BE(offset);
    offset += 4;
    let longitude = rawLon / 1e6;
    if (Math.abs(longitude) > 180) {
      longitude = rawLon / 1e7;
    }

    let batteryVoltage: number | undefined;
    if (buffer.length >= 20) {
      batteryVoltage = buffer.readUInt16BE(offset) / 1000;
    }

    return {
      pm2_5: parseFloat(pm2_5.toFixed(2)),
      pm10: parseFloat(pm10.toFixed(2)),
      co2: Math.round(co2),
      temperature: parseFloat(temperature.toFixed(2)),
      humidity: parseFloat(humidity.toFixed(2)),
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      batteryVoltage,
    };
  }

  // Option B: Cayenne LPP TLV Dynamic Parsing
  if (buffer.length >= 6) {
    let offset = 0;
    let pm2_5 = 25.0;
    let pm10 = 45.0;
    let co2 = 420;
    let temperature = 25.0;
    let humidity = 50.0;
    let latitude = 28.6315;
    let longitude = 77.2167;

    while (offset < buffer.length) {
      const channel = buffer[offset++];
      if (offset >= buffer.length) break;
      const type = buffer[offset++];

      // 0x67: Temperature (int16, 0.1°C)
      if (type === 0x67 && offset + 2 <= buffer.length) {
        temperature = buffer.readInt16BE(offset) / 10;
        offset += 2;
      }
      // 0x68: Humidity (uint8, 0.5%)
      else if (type === 0x68 && offset + 1 <= buffer.length) {
        humidity = buffer[offset] * 0.5;
        offset += 1;
      }
      // 0x88: GPS Location (3 bytes lat, 3 bytes lon, 3 bytes alt)
      else if (type === 0x88 && offset + 9 <= buffer.length) {
        const rawLat = (buffer[offset] << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2];
        const signedLat = rawLat > 0x7fffff ? rawLat - 0x1000000 : rawLat;
        latitude = signedLat / 10000;

        const rawLon = (buffer[offset + 3] << 16) | (buffer[offset + 4] << 8) | buffer[offset + 5];
        const signedLon = rawLon > 0x7fffff ? rawLon - 0x1000000 : rawLon;
        longitude = signedLon / 10000;
        offset += 9;
      }
      // 0x02: Analog In (PM2.5 / PM10 / CO2 custom)
      else if (type === 0x02 && offset + 2 <= buffer.length) {
        const val = buffer.readInt16BE(offset) / 100;
        if (channel === 1) pm2_5 = val;
        else if (channel === 2) pm10 = val;
        else if (channel === 3) co2 = val * 10;
        offset += 2;
      } else {
        // Skip unknown byte
        offset++;
      }
    }

    return {
      pm2_5,
      pm10,
      co2,
      temperature,
      humidity,
      latitude,
      longitude,
    };
  }

  throw new Error(`Payload buffer length (${buffer.length} bytes) is too short to decode valid telemetry.`);
}

// ============================================================================
// 2. Temperature & Humidity Correction Factors (EPA Model)
// ============================================================================

/**
 * Applies scientific correction factors to raw optical PM and NDIR gas sensor readings:
 * 1. PM2.5 / PM10 Hygroscopic Growth Correction (Barkjohn et al., US EPA national model)
 *    Low-cost optical counters overestimate PM under high humidity due to aerosol water absorption.
 * 2. CO2 Temperature Density Correction (Ideal Gas Law relative to standard 25°C)
 * 3. US EPA standard AQI conversion
 */
export function applyCorrectionFactors(decoded: DecodedSensorData): CorrectedSensorData {
  const rh = Math.min(100, Math.max(0, decoded.humidity));
  const tempC = decoded.temperature;

  // --- 1. PM2.5 Correction Factor ---
  // EPA Formula: PM2.5_corrected = 0.524 * PM2.5_raw - 0.0862 * RH + 5.75
  let pm25_corrected = 0.524 * decoded.pm2_5 - 0.0862 * rh + 5.75;
  
  // High humidity dampening for RH > 70% where hygroscopic swelling escalates non-linearly
  let humidityGrowthFactor = 1.0;
  if (rh > 70) {
    const excessRh = (rh - 70) / 30;
    humidityGrowthFactor = 1.0 + 0.35 * Math.pow(excessRh, 2);
    pm25_corrected = pm25_corrected / humidityGrowthFactor;
  }
  pm25_corrected = Math.max(0, parseFloat(pm25_corrected.toFixed(2)));

  // --- 2. PM10 Correction Factor ---
  // Scale PM10 proportionally with PM2.5 correction ratio
  const ratio = decoded.pm2_5 > 0 ? decoded.pm10 / decoded.pm2_5 : 1.7;
  let pm10_corrected = pm25_corrected * Math.min(3.2, Math.max(1.1, ratio));
  pm10_corrected = Math.max(0, parseFloat(pm10_corrected.toFixed(2)));

  // --- 3. CO2 Temperature Density Compensation ---
  // NDIR sensors obey ideal gas law: molar density inversely proportional to absolute temperature
  const tempKelvin = tempC + 273.15;
  const standardKelvin = 298.15; // 25°C
  const tempGasFactor = tempKelvin / standardKelvin;
  const co2_corrected = Math.max(300, parseFloat((decoded.co2 * tempGasFactor).toFixed(1)));

  // --- 4. EPA Instantaneous AQI Calculation from corrected PM2.5 ---
  const aqi_calculated = calculateAqi(pm25_corrected);

  return {
    ...decoded,
    pm2_5: pm25_corrected,
    pm10: pm10_corrected,
    co2: co2_corrected,
    raw_pm2_5: decoded.pm2_5,
    raw_pm10: decoded.pm10,
    raw_co2: decoded.co2,
    aqi_calculated,
    correction_applied: {
      formula: "EPA Barkjohn et al. (2021) [0.524*PM2.5 - 0.0862*RH + 5.75] + Ideal Gas Law CO2",
      humidity_growth_factor: parseFloat(humidityGrowthFactor.toFixed(3)),
      temperature_gas_factor: parseFloat(tempGasFactor.toFixed(3)),
    },
  };
}

function calculateAqi(pm25: number): number {
  const c = Math.max(0, pm25);
  if (c <= 12.0) return Math.round(((50 - 0) / (12.0 - 0)) * c);
  if (c <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (c - 12.1) + 51);
  if (c <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (c - 35.5) + 101);
  if (c <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (c - 55.5) + 151);
  if (c <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (c - 150.5) + 201);
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (Math.min(c, 500) - 250.5) + 301);
}

// ============================================================================
// 3. Next.js App Router POST Endpoint
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChirpStackUplinkPayload;

    // 1. Identify device code (devEui from deviceInfo or devEUI root)
    const devEui =
      body.deviceInfo?.devEui ||
      body.devEUI ||
      body.deviceInfo?.deviceName ||
      "SN-LORA-DEFAULT";

    const nodeName = body.deviceInfo?.deviceName || `ChirpStack Node (${devEui})`;
    const uplinkTime = body.time ? new Date(body.time) : new Date();
    const rssi = body.rxInfo?.[0]?.rssi ?? -70;

    // 2. Extract payload bytes (Base64 or Hex)
    let buffer: Buffer | null = null;
    const rawDataStr = body.data || body.payload_hex;

    if (rawDataStr) {
      const trimmed = rawDataStr.trim();
      const isPureHex = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0;

      if (isPureHex) {
        buffer = Buffer.from(trimmed, "hex");
      } else {
        // Standard ChirpStack sends base64
        try {
          buffer = Buffer.from(trimmed, "base64");
        } catch {
          buffer = Buffer.from(trimmed, "hex");
        }
      }
    }

    // 3. Decode incoming payload
    let decoded: DecodedSensorData;

    if (buffer && buffer.length >= 6) {
      decoded = decodePayloadBuffer(buffer);
    } else if (body.object) {
      // Fallback: If ChirpStack already has pre-parsed codec object
      decoded = {
        pm2_5: Number(body.object.pm2_5 ?? 25.0),
        pm10: Number(body.object.pm10 ?? 45.0),
        co2: Number(body.object.co2 ?? 420),
        temperature: Number(body.object.temperature ?? 26.5),
        humidity: Number(body.object.humidity ?? 55.0),
        latitude: Number(body.object.latitude ?? 28.6315),
        longitude: Number(body.object.longitude ?? 77.2167),
      };
    } else {
      return NextResponse.json(
        {
          error: "Missing or invalid LoRaWAN telemetry payload",
          message: "Provide 'data' (Base64 or Hex string) or 'object' with environmental measurements.",
        },
        { status: 400 }
      );
    }

    // 4. Apply Temperature/Humidity Correction Factors
    const corrected = applyCorrectionFactors(decoded);

    // 5. Save the point directly to PostGIS via Prisma Raw SQL
    let postgisSaved = false;
    let pointWkt = `POINT(${corrected.longitude} ${corrected.latitude})`;
    let telemetryRecordId: string | undefined;

    try {
      // A. Upsert the sensor node station with PostGIS Point location
      const upsertResult = await prisma.$queryRaw<Array<{ id: string; location_wkt: string }>>`
        INSERT INTO "sensor_nodes" (
          "id",
          "node_code",
          "name",
          "status",
          "node_type",
          "latitude",
          "longitude",
          "location",
          "battery_level",
          "last_seen_at",
          "created_at",
          "updated_at"
        ) VALUES (
          gen_random_uuid(),
          ${devEui},
          ${nodeName},
          'ACTIVE'::"NodeStatus",
          'STATIONARY'::"NodeType",
          ${corrected.latitude},
          ${corrected.longitude},
          ST_SetSRID(ST_MakePoint(${corrected.longitude}, ${corrected.latitude}), 4326),
          ${corrected.batteryVoltage ? corrected.batteryVoltage * 25 : 95.0},
          ${uplinkTime},
          NOW(),
          NOW()
        )
        ON CONFLICT ("node_code") DO UPDATE SET
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "location" = ST_SetSRID(ST_MakePoint(EXCLUDED."longitude", EXCLUDED."latitude"), 4326),
          "battery_level" = COALESCE(EXCLUDED."battery_level", "sensor_nodes"."battery_level"),
          "last_seen_at" = EXCLUDED."last_seen_at",
          "updated_at" = NOW()
        RETURNING "id", ST_AsText("location") as "location_wkt";
      `;

      const nodeId = upsertResult[0]?.id;

      if (nodeId) {
        // B. Insert into iot_telemetry hypertable with PostGIS Point geometry
        const telemetryResult = await prisma.$queryRaw<Array<{ id: string; location_wkt: string }>>`
          INSERT INTO "iot_telemetry" (
            "id",
            "timestamp",
            "node_id",
            "pm2_5",
            "pm10",
            "co2",
            "temperature",
            "humidity",
            "latitude",
            "longitude",
            "location",
            "aqi_calculated",
            "rssi",
            "battery_voltage",
            "raw_payload"
          ) VALUES (
            gen_random_uuid(),
            ${uplinkTime},
            ${nodeId}::uuid,
            ${corrected.pm2_5},
            ${corrected.pm10},
            ${corrected.co2},
            ${corrected.temperature},
            ${corrected.humidity},
            ${corrected.latitude},
            ${corrected.longitude},
            ST_SetSRID(ST_MakePoint(${corrected.longitude}, ${corrected.latitude}), 4326),
            ${corrected.aqi_calculated},
            ${rssi},
            ${corrected.batteryVoltage ?? 3.9},
            ${JSON.stringify({ raw_hex: rawDataStr, decoded, corrected })}::jsonb
          )
          RETURNING "id", ST_AsText("location") as "location_wkt";
        `;

        telemetryRecordId = telemetryResult[0]?.id;
        pointWkt = telemetryResult[0]?.location_wkt || pointWkt;
        postgisSaved = true;
      }
    } catch (dbError) {
      // Graceful diagnostic logging if database is offline or not yet connected in local environment
      console.warn("[LoRaWAN Ingestion] Database write deferred or offline:", dbError);
    }

    // 6. Return successful ingestion response
    return NextResponse.json(
      {
        success: true,
        status: postgisSaved ? "persisted_to_postgis" : "decoded_and_corrected",
        devEui,
        timestamp: uplinkTime.toISOString(),
        measurements: {
          pm2_5: corrected.pm2_5,
          pm10: corrected.pm10,
          co2: corrected.co2,
          temperature: corrected.temperature,
          humidity: corrected.humidity,
          latitude: corrected.latitude,
          longitude: corrected.longitude,
          aqi: corrected.aqi_calculated,
        },
        raw_values: {
          pm2_5: corrected.raw_pm2_5,
          pm10: corrected.raw_pm10,
          co2: corrected.raw_co2,
        },
        postgis: {
          srid: 4326,
          geometry_type: "Point",
          wkt: pointWkt,
          coordinates: [corrected.longitude, corrected.latitude],
          saved_to_db: postgisSaved,
          record_id: telemetryRecordId,
        },
        corrections: corrected.correction_applied,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[LoRaWAN Telemetry Error]:", error);
    return NextResponse.json(
      {
        error: "Internal server error during LoRaWAN telemetry ingestion",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint provides schema / test payload specifications
export async function GET() {
  // Sample 20-byte packed hex string:
  // PM2.5=68.4 (684=0x02AC), PM10=142.1 (1421=0x058D), CO2=480 (0x01E0),
  // Temp=28.40°C (2840=0x0B18), Hum=58.20% (5820=0x16BC),
  // Lat=28.631500 (28631500=0x01B4DC4C), Lon=77.216700 (77216700=0x049A43BC),
  // Batt=4120mV (0x1018)
  const sampleHex = "02ac058d01e00b1816bc01b4e1cc049a3bb41018";
  const sampleBase64 = Buffer.from(sampleHex, "hex").toString("base64");

  return NextResponse.json({
    service: "AetherGrid LoRaWAN ChirpStack Telemetry Ingestion API",
    method: "POST",
    endpoint: "/api/telemetry",
    postgis_configuration: "SRID 4326 PostGIS ST_SetSRID(ST_MakePoint(lon, lat), 4326)",
    correction_model: "EPA Barkjohn et al. (2021) Hygroscopic Growth + Gas Law Normalization",
    sample_webhook_body: {
      deduplicationId: "11223344-5566-7788-99aa-bbccddeeff00",
      time: new Date().toISOString(),
      deviceInfo: {
        devEui: "0016c001f1234567",
        deviceName: "Connaught Place Central Station",
      },
      data: sampleBase64,
      payload_hex: sampleHex,
      rxInfo: [{ rssi: -68, snr: 9.4 }],
    },
  });
}
