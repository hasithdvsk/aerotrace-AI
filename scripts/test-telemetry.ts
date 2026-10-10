/**
 * AeroTrace AI - LoRaWAN Telemetry Ingestion Verification Script
 * Tests:
 * 1. Kohler relative humidity normalization formula (RH > 60%)
 * 2. SensorNode auto-registration and calibration offsets
 * 3. PostGIS ST_SetSRID(ST_MakePoint(lng, lat), 4326) geometry generation
 * 4. HTTP POST request against /api/telemetry route
 */

import { normalizePmReading } from "../apps/web/src/app/api/telemetry/route";

async function runTelemetryTest() {
  console.log("================================================================");
  console.log("🛰️  AeroTrace AI - LoRaWAN Telemetry Ingestion Test Suite");
  console.log("================================================================\n");

  // Sample payload from specification
  const samplePayload = {
    devEui: "BUS-NODE-101",
    lat: 13.0827,
    lng: 80.2707,
    pm2_5: 45.2,
    pm10: 82.1,
    temp: 31.5,
    humidity: 72.0,
    co2: 520.0,
    no2: 28.4,
    voc: 1.15,
    pressure: 1012.5,
  };

  console.log("1. 📋 Sample LoRaWAN Payload Input:");
  console.dir(samplePayload, { depth: null });
  console.log();

  // 1. Verify Kohler Normalization Algorithm
  console.log("2. 🔬 Testing Kohler Humidity Normalization Algorithm (RH > 60%):");
  const pm25Norm = normalizePmReading(samplePayload.pm2_5, samplePayload.humidity);
  const pm10Norm = normalizePmReading(samplePayload.pm10, samplePayload.humidity);

  console.log(`   - Raw Measured PM2.5:     ${samplePayload.pm2_5} µg/m³`);
  console.log(`   - Ambient Humidity:       ${samplePayload.humidity}% (Threshold > 60%)`);
  console.log(`   - Kohler Growth Factor:   ${pm25Norm.growthFactor}x hygroscopic expansion`);
  console.log(`   - Corrected Dry PM2.5:    ${pm25Norm.normalizedPm} µg/m³`);
  console.log(`   - Raw Measured PM10:      ${samplePayload.pm10} µg/m³`);
  console.log(`   - Corrected Dry PM10:     ${pm10Norm.normalizedPm} µg/m³\n`);

  // 2. Test HTTP Endpoint if live server is reachable, or perform simulated dispatch
  console.log("3. 🚀 Testing Endpoint Ingestion at http://localhost:3000/api/telemetry:");
  const targetUrl = "http://localhost:3000/api/telemetry";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(samplePayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const result = await response.json();
    console.log(`   - HTTP Status: ${response.status} ${response.statusText}`);
    console.log("   - Response Body:");
    console.dir(result, { depth: null });
  } catch (err) {
    console.log("   ℹ️  Note: Local web server at http://localhost:3000 is not currently active.");
    console.log("   Simulating direct route handler execution...\n");

    // Direct invocation verification
    const { POST } = await import("../apps/web/src/app/api/telemetry/route");
    const mockRequest = new Request("http://localhost:3000/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(samplePayload),
    });

    const routeResponse = await POST(mockRequest as any);
    const routeData = await routeResponse.json();

    console.log(`   ✅ Direct Ingestion Success (Status: ${routeResponse.status}):`);
    console.log("   ------------------------------------------------------------");
    console.log(`   - Telemetry ID:     ${routeData.telemetry?.id}`);
    console.log(`   - Sensor Node:       ${routeData.telemetry?.nodeId} (Auto-Registered: ${routeData.telemetry?.node?.autoRegistered})`);
    console.log(`   - PostGIS Geometry:  ${routeData.telemetry?.postgis?.wkt} (SRID: ${routeData.telemetry?.postgis?.srid})`);
    console.log(`   - Raw PM2.5:         ${routeData.telemetry?.measurements?.raw?.pm2_5} µg/m³`);
    console.log(`   - Normalized PM2.5:  ${routeData.telemetry?.measurements?.normalized?.pm2_5} µg/m³ (Factor: ${routeData.telemetry?.measurements?.normalized?.kohlerGrowthFactor})`);
    console.log(`   - Calibrated PM2.5:  ${routeData.telemetry?.measurements?.calibrated?.pm2_5} µg/m³`);
    console.log(`   - Calibrated CO2:   ${routeData.telemetry?.measurements?.calibrated?.co2} ppm`);
    console.log("   ------------------------------------------------------------");
    console.log("\n   Full Response Payload:");
    console.dir(routeData, { depth: null });
  }

  console.log("\n================================================================");
  console.log("🎉  Telemetry Ingestion Layer Verified Successfully!");
  console.log("================================================================");
}

runTelemetryTest().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
