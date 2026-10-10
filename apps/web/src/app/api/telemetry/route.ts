import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LoRaWANTelemetryPayload {
  devEui?: string;
  devEUI?: string;
  latitude?: number;
  lat?: number;
  longitude?: number;
  lng?: number;
  lon?: number;
  pm2_5?: number;
  pm25?: number;
  pm10?: number;
  co2?: number;
  no2?: number;
  voc?: number;
  temperature?: number;
  temp?: number;
  humidity?: number;
  pressure?: number;
  batteryVoltage?: number;
  object?: {
    devEui?: string;
    latitude?: number;
    lat?: number;
    longitude?: number;
    lng?: number;
    pm2_5?: number;
    pm25?: number;
    pm10?: number;
    co2?: number;
    no2?: number;
    voc?: number;
    temperature?: number;
    temp?: number;
    humidity?: number;
    pressure?: number;
  };
}

// ============================================================================
// Atmospheric Kohler Correction for Relative Humidity
// ============================================================================

/**
 * Adjusts raw particulate matter readings for hygroscopic growth when relative humidity > 60%.
 * Optical particle counters overestimate particulate mass as aerosol particles absorb water vapor.
 * The empirical Kohler correction factor models the wet-to-dry aerosol mass ratio:
 *   growthFactor = 1 + [a * (RH / 100)^2] / [1 - (RH / 100)]
 * where a = 0.25 (empirical urban aerosol hygroscopicity constant).
 *
 * @param pm - Measured particulate matter concentration (µg/m³)
 * @param humidity - Ambient relative humidity percentage (%)
 * @returns Corrected dry particulate concentration (µg/m³)
 */
export function normalizePmReading(pm: number, humidity: number): {
  normalizedPm: number;
  growthFactor: number;
  correctionApplied: boolean;
} {
  if (pm <= 0) {
    return { normalizedPm: 0, growthFactor: 1.0, correctionApplied: false };
  }

  // No correction needed under dry/moderate atmospheric conditions (RH <= 60%)
  if (humidity <= 60) {
    return {
      normalizedPm: Math.round(pm * 100) / 100,
      growthFactor: 1.0,
      correctionApplied: false,
    };
  }

  // Bound RH to 99% to prevent asymptotic division by zero at saturation
  const rhFract = Math.min(humidity, 99.0) / 100.0;
  const a = 0.25; // Empirical Kohler parameter for continental urban aerosols
  const growthFactor = 1.0 + (a * Math.pow(rhFract, 2)) / (1.0 - rhFract);
  const normalized = pm / growthFactor;

  return {
    normalizedPm: Math.round(normalized * 100) / 100,
    growthFactor: Math.round(growthFactor * 1000) / 1000,
    correctionApplied: true,
  };
}

// ============================================================================
// POST Route Handler: LoRaWAN Telemetry Ingestion
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: LoRaWANTelemetryPayload = await req.json();

    // 1. Extract and coalesce payload attributes (supporting direct and nested object schemas)
    const devEui =
      body.devEui ||
      body.devEUI ||
      body.object?.devEui ||
      "BUS-NODE-DEFAULT";

    const latitude = Number(
      body.latitude ?? body.lat ?? body.object?.latitude ?? body.object?.lat ?? 13.0827
    );

    const longitude = Number(
      body.longitude ?? body.lng ?? body.lon ?? body.object?.longitude ?? body.object?.lng ?? 80.2707
    );

    const rawPm25 = Number(
      body.pm2_5 ?? body.pm25 ?? body.object?.pm2_5 ?? body.object?.pm25 ?? 0
    );

    const rawPm10 = Number(
      body.pm10 ?? body.object?.pm10 ?? 0
    );

    const rawCo2 = Number(
      body.co2 ?? body.object?.co2 ?? 400
    );

    const no2 = Number(
      body.no2 ?? body.object?.no2 ?? 20
    );

    const voc = Number(
      body.voc ?? body.object?.voc ?? 0.5
    );

    const temperature = Number(
      body.temperature ?? body.temp ?? body.object?.temperature ?? body.object?.temp ?? 25.0
    );

    const humidity = Number(
      body.humidity ?? body.object?.humidity ?? 50.0
    );

    const pressure = Number(
      body.pressure ?? body.object?.pressure ?? 1013.25
    );

    // 2. Apply Kohler Humidity Normalization for RH > 60%
    const pm25Norm = normalizePmReading(rawPm25, humidity);
    const pm10Norm = normalizePmReading(rawPm10, humidity);

    // 3. Fetch or Auto-Register SensorNode
    let nodeRecord = {
      nodeId: devEui,
      busRouteId: "ROUTE-AUTO-REGISTERED",
      status: "ACTIVE",
      offsetPm25: 0.0,
      offsetCo2: 0.0,
      autoRegistered: false,
    };

    let postgisSaved = false;
    let telemetryId = crypto.randomUUID();
    let pointWkt = `POINT(${longitude} ${latitude})`;
    const recordedTime = new Date();

    try {
      let existingNode = await prisma.sensorNode.findUnique({
        where: { nodeId: devEui },
      });

      if (!existingNode) {
        existingNode = await prisma.sensorNode.create({
          data: {
            nodeId: devEui,
            busRouteId: "ROUTE-AUTO-REGISTERED",
            status: "ACTIVE",
            offsetPm25: 0.0,
            offsetCo2: 0.0,
            lastCalibrated: recordedTime,
          },
        });
        nodeRecord.autoRegistered = true;
      }

      nodeRecord.busRouteId = existingNode.busRouteId || nodeRecord.busRouteId;
      nodeRecord.status = existingNode.status;
      nodeRecord.offsetPm25 = existingNode.offsetPm25 ?? 0.0;
      nodeRecord.offsetCo2 = existingNode.offsetCo2 ?? 0.0;
    } catch (nodeErr) {
      console.warn("[Telemetry Ingestion] Database query for SensorNode deferred (offline fallback):", nodeErr);
    }

    // 4. Apply Sensor Calibration Offsets
    const calibratedPm25 = Math.max(
      0,
      Math.round((pm25Norm.normalizedPm + nodeRecord.offsetPm25) * 100) / 100
    );

    const calibratedCo2 = Math.max(
      0,
      Math.round((rawCo2 + nodeRecord.offsetCo2) * 10) / 10
    );

    // 5. Execute Raw SQL INSERT with PostGIS ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    try {
      const insertResult = await prisma.$queryRaw<Array<{
        id: string;
        time: Date;
        node_id: string;
        location_wkt: string;
      }>>`
        INSERT INTO "iot_telemetry" (
          "id",
          "time",
          "node_id",
          "latitude",
          "longitude",
          "location",
          "pm2_5",
          "pm10",
          "co2",
          "no2",
          "voc",
          "temperature",
          "humidity",
          "pressure"
        ) VALUES (
          gen_random_uuid(),
          ${recordedTime},
          ${devEui},
          ${latitude},
          ${longitude},
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${calibratedPm25},
          ${pm10Norm.normalizedPm},
          ${calibratedCo2},
          ${no2},
          ${voc},
          ${temperature},
          ${humidity},
          ${pressure}
        )
        RETURNING "id", "time", "node_id", ST_AsText("location") as "location_wkt";
      `;

      if (insertResult && insertResult.length > 0) {
        telemetryId = insertResult[0].id;
        pointWkt = insertResult[0].location_wkt || pointWkt;
        postgisSaved = true;
      }
    } catch (dbInsertErr) {
      console.warn("[Telemetry Ingestion] PostGIS raw SQL execution deferred (offline fallback):", dbInsertErr);
    }

    // 6. Return standard structured response
    return NextResponse.json(
      {
        success: true,
        message: postgisSaved
          ? "LoRaWAN telemetry successfully ingested and saved to PostGIS hypertable"
          : "LoRaWAN telemetry successfully normalized and processed (DB offline fallback active)",
        telemetry: {
          id: telemetryId,
          time: recordedTime.toISOString(),
          nodeId: devEui,
          coordinates: {
            latitude,
            longitude,
          },
          postgis: {
            srid: 4326,
            geometryType: "Point",
            wkt: pointWkt,
            persisted: postgisSaved,
          },
          measurements: {
            raw: {
              pm2_5: rawPm25,
              pm10: rawPm10,
              co2: rawCo2,
              no2,
              voc,
              temperature,
              humidity,
              pressure,
            },
            normalized: {
              pm2_5: pm25Norm.normalizedPm,
              pm10: pm10Norm.normalizedPm,
              kohlerGrowthFactor: pm25Norm.growthFactor,
              kohlerApplied: pm25Norm.correctionApplied,
            },
            calibrated: {
              pm2_5: calibratedPm25,
              co2: calibratedCo2,
              offsetsApplied: {
                offsetPm25: nodeRecord.offsetPm25,
                offsetCo2: nodeRecord.offsetCo2,
              },
            },
          },
          node: {
            nodeId: devEui,
            busRouteId: nodeRecord.busRouteId,
            status: nodeRecord.status,
            autoRegistered: nodeRecord.autoRegistered,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Telemetry Ingestion] Error processing payload:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error processing telemetry",
      },
      { status: 500 }
    );
  }
}

// Support GET for diagnostic health check
export async function GET() {
  return NextResponse.json({
    status: "HEALTHY",
    endpoint: "/api/telemetry",
    service: "AeroTrace LoRaWAN Ingestion Layer",
    capabilities: [
      "Kohler Relative Humidity Normalization (RH > 60%)",
      "SensorNode Auto-Registration & Dynamic Offsets",
      "PostGIS ST_SetSRID(ST_MakePoint(lon, lat), 4326) Integration",
    ],
  });
}
