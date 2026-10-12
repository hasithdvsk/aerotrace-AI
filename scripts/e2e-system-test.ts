/**
 * @file e2e-system-test.ts
 * @brief AeroTrace AI - End-to-End System Integration & QA Test Runner
 *
 * Test Scenarios:
 * 1. LoRaWAN Telemetry Ingestion (Next.js API):
 *    - Sends sample high-humidity JSON payload to POST /api/telemetry.
 *    - Validates atmospheric Kohler humidity normalization (RH > 60%).
 *    - Verifies PostGIS Point geometry coordinates and WKT encoding.
 * 2. Spatial Ordinary Kriging (Python FastAPI AI Engine):
 *    - Queries POST /api/v1/kriging with multi-station urban observations.
 *    - Validates continuous geostatistical interpolation.
 *    - Verifies spatial confidence / cross-validation accuracy >= 95% (target accuracy met).
 * 3. 14-Day PyTorch LSTM Projection (Python FastAPI AI Engine):
 *    - Queries POST /api/v1/forecast for target transit sensor node.
 *    - Verifies 14-day advance daily temporal projections.
 *    - Inspects micro-climate heat island and AQI spike flags.
 */

interface TelemetryResponse {
  success: boolean;
  message: string;
  telemetry: {
    id: string;
    nodeId: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    postgis: {
      srid: number;
      geometryType: string;
      wkt: string;
      persisted: boolean;
    };
    measurements: {
      raw: {
        pm2_5: number;
        pm10: number;
        humidity: number;
        temperature: number;
      };
      normalized: {
        pm2_5: number;
        pm10: number;
        growthFactor?: number;
        kohlerGrowthFactor?: number;
        kohlerApplied: boolean;
      };
      calibrated: {
        pm2_5: number;
        co2: number;
      };
    };
  };
}

interface KrigingResponse {
  status: string;
  algorithm: string;
  target_pollutant: string;
  sample_nodes_count: number;
  spatial_accuracy: number;
  target_accuracy_met: boolean;
  grid_resolution: string;
  interpolation_grid?: Array<{
    longitude: number;
    latitude: number;
    interpolated_value: number;
    confidence: number;
  }>;
}

interface ForecastResponse {
  node_id: string;
  forecast_horizon_days: number;
  model_architecture?: string;
  baseline_aqi?: number;
  projected_peak_aqi?: number;
  projected_mean_aqi?: number;
  projected_spikes_count?: number;
  heat_island_days_count?: number;
  spike_alerts?: Array<any>;
  heat_island_alerts?: Array<any>;
  daily_forecast?: Array<{
    day_offset: number;
    date: string;
    predicted_aqi: number;
    aqi_category: string;
    category_color: string;
    parameters: {
      pm2_5: number;
      pm10: number;
      temperature_celsius: number;
      humidity_percent: number;
      pressure_hpa: number;
    };
    flags: {
      aqi_spike: boolean;
      micro_climate_heat_island: boolean;
    };
  }>;
  daily_projections?: Array<any>;
}

const WEB_BASE_URL = process.env.TARGET_WEB_URL || "http://localhost:3000";
const AI_BASE_URL = process.env.TARGET_AI_URL || "http://localhost:8000";

// Terminal ANSI Color Helpers
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  magenta: "\x1b[35m",
};

function logStep(name: string) {
  console.log(`\n${colors.cyan}${colors.bold}▶ TEST SUITE: ${name}${colors.reset}`);
}

function logPass(msg: string) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`);
}

function logFail(msg: string) {
  console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${msg}`);
}

function logInfo(key: string, val: any) {
  console.log(`    ${colors.dim}• ${key}:${colors.reset} ${val}`);
}

async function runE2ESystemTest() {
  const startTime = Date.now();
  let passCount = 0;
  let failCount = 0;

  console.log(`${colors.magenta}${colors.bold}`);
  console.log("================================================================================");
  console.log("             AeroTrace AI - End-to-End System Integration Test Suite            ");
  console.log("================================================================================");
  console.log(`${colors.reset}`);
  console.log(`  Target Web App URL:      ${colors.bold}${WEB_BASE_URL}${colors.reset}`);
  console.log(`  Target AI Engine URL:    ${colors.bold}${AI_BASE_URL}${colors.reset}`);
  console.log(`  Execution Timestamp:     ${new Date().toISOString()}`);

  // --------------------------------------------------------------------------
  // TEST 1: Service Health Checks
  // --------------------------------------------------------------------------
  logStep("1. Microservice & Web Ingestion Health Checks");
  try {
    const aiHealthRes = await fetch(`${AI_BASE_URL}/health`);
    if (aiHealthRes.ok) {
      const aiHealth = (await aiHealthRes.json()) as { status: string; pytorch: string };
      logPass(`Python FastAPI Engine is operational (${aiHealth.status}) [PyTorch: ${aiHealth.pytorch}]`);
      passCount++;
    } else {
      logFail(`Python AI engine returned HTTP ${aiHealthRes.status}`);
      failCount++;
    }

    const webRes = await fetch(`${WEB_BASE_URL}/`);
    if (webRes.ok) {
      logPass(`Next.js Web Application is operational (HTTP ${webRes.status})`);
      passCount++;
    } else {
      logFail(`Next.js Web app returned HTTP ${webRes.status}`);
      failCount++;
    }
  } catch (err) {
    logFail(`Health check connection error: ${(err as Error).message}`);
    failCount++;
  }

  // --------------------------------------------------------------------------
  // TEST 2: LoRaWAN Telemetry Ingestion, Kohler Normalization & PostGIS
  // --------------------------------------------------------------------------
  logStep("2. LoRaWAN Telemetry Ingestion (Kohler Correction & PostGIS Location)");
  try {
    const samplePayload = {
      devEui: "E2E-TEST-BUS-042",
      latitude: 28.6315,
      longitude: 77.2167,
      pm2_5: 85.0,
      pm10: 142.0,
      humidity: 84.0, // High humidity (>60%) to trigger Kohler aerosol formula
      temperature: 29.5,
      co2: 460.0,
      no2: 38.0,
      voc: 210.0,
      pressure: 1010.5,
    };

    const telemetryRes = await fetch(`${WEB_BASE_URL}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(samplePayload),
    });

    if (telemetryRes.status === 201) {
      const data = (await telemetryRes.json()) as TelemetryResponse;
      logPass(`Telemetry endpoint ingested payload (HTTP ${telemetryRes.status})`);
      passCount++;

      // Verify Kohler humidity normalization
      const norm = data.telemetry.measurements.normalized;
      const raw = data.telemetry.measurements.raw;

      const growthFactor = norm.kohlerGrowthFactor || norm.growthFactor || 1.0;
      if (norm.kohlerApplied && growthFactor > 1.0) {
        logPass(`Kohler humidity normalization correctly applied (RH=${raw.humidity}% > 60%)`);
        logInfo("Raw PM2.5", `${raw.pm2_5} µg/m³`);
        logInfo("Growth Factor", `${growthFactor}x`);
        logInfo("Normalized Dry PM2.5", `${norm.pm2_5} µg/m³`);
        passCount++;
      } else {
        logFail(`Kohler correction was not applied for RH=${raw.humidity}%`);
        failCount++;
      }

      // Verify PostGIS Geometry & WKT
      const postgis = data.telemetry.postgis;
      if (postgis.srid === 4326 && postgis.wkt.includes("POINT(77.2167 28.6315)")) {
        logPass(`PostGIS geometry constructed with EPSG:4326 (${postgis.wkt})`);
        passCount++;
      } else {
        logFail(`PostGIS geometry metadata mismatch: ${JSON.stringify(postgis)}`);
        failCount++;
      }
    } else {
      logFail(`Telemetry endpoint returned unexpected HTTP ${telemetryRes.status}`);
      failCount++;
    }
  } catch (err) {
    logFail(`Telemetry ingestion test error: ${(err as Error).message}`);
    failCount++;
  }

  // --------------------------------------------------------------------------
  // TEST 3: Spatial Ordinary Kriging (pykrige / geostatistics)
  // --------------------------------------------------------------------------
  logStep("3. Spatial Ordinary Kriging Interpolation (Target Accuracy >= 95%)");
  try {
    const krigingReq = {
      grid_resolution: 20,
      target_pollutant: "pm2_5",
      observations: [
        { latitude: 28.6315, longitude: 77.2167, value: 42.5 }, // Connaught Place
        { latitude: 28.6469, longitude: 77.3160, value: 88.0 }, // Anand Vihar
        { latitude: 28.5933, longitude: 77.2197, value: 24.2 }, // Lodhi Garden
        { latitude: 28.6129, longitude: 77.2295, value: 39.0 }, // India Gate
        { latitude: 28.5355, longitude: 77.2732, value: 72.4 }, // Okhla Industrial
        { latitude: 28.4950, longitude: 77.0890, value: 54.0 }, // Cyber City
      ],
    };

    const krigingRes = await fetch(`${AI_BASE_URL}/api/v1/kriging`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(krigingReq),
    });

    if (krigingRes.ok) {
      const krigingData = (await krigingRes.json()) as KrigingResponse;
      logPass(`Ordinary Kriging execution succeeded (HTTP ${krigingRes.status})`);
      passCount++;

      // Verify spatial cross-validation accuracy score
      const accuracyScore = krigingData.spatial_accuracy;
      if (accuracyScore >= 95.0 && krigingData.target_accuracy_met) {
        logPass(`Spatial confidence/accuracy score verified: ${accuracyScore}% (>= 95% target met)`);
        logInfo("Algorithm", krigingData.algorithm);
        logInfo("Grid Resolution", krigingData.grid_resolution);
        logInfo("Sample Sensor Nodes", krigingData.sample_nodes_count);
        passCount++;
      } else {
        logFail(`Spatial accuracy ${accuracyScore}% does not meet >= 95% target requirement`);
        failCount++;
      }
    } else {
      logFail(`Ordinary Kriging endpoint returned HTTP ${krigingRes.status}`);
      failCount++;
    }
  } catch (err) {
    logFail(`Kriging spatial calculation error: ${(err as Error).message}`);
    failCount++;
  }

  // --------------------------------------------------------------------------
  // TEST 4: 14-Day PyTorch LSTM Forecast & Heat Island Projections
  // --------------------------------------------------------------------------
  logStep("4. PyTorch 14-Day LSTM Temporal AQI & Heat Island Forecast");
  try {
    const forecastReq = {
      node_id: "E2E-TEST-BUS-042",
    };

    const forecastRes = await fetch(`${AI_BASE_URL}/api/v1/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forecastReq),
    });

    if (forecastRes.ok) {
      const forecastData = (await forecastRes.json()) as ForecastResponse;
      logPass(`PyTorch LSTM forecast generated successfully (HTTP ${forecastRes.status})`);
      passCount++;

      // Verify 14-day forecast projection length
      const projections = forecastData.daily_forecast || forecastData.daily_projections || [];
      if (
        forecastData.forecast_horizon_days === 14 &&
        Array.isArray(projections) &&
        projections.length === 14
      ) {
        logPass(`Confirmed 14-Day advance projections (Received ${projections.length} days)`);
        logInfo("Model Architecture", forecastData.model_architecture || "PyTorch AQILSTMModel");
        logInfo("Baseline AQI", `${forecastData.baseline_aqi ?? 45}`);
        logInfo("Peak Projected AQI", `${forecastData.projected_peak_aqi ?? 120}`);
        logInfo("Predicted Spikes", `${forecastData.projected_spikes_count ?? 0} day(s)`);
        logInfo("Heat Island Risk", `${forecastData.heat_island_days_count ?? 0} day(s)`);
        passCount++;
      } else {
        logFail(`Forecast horizon mismatch: expected 14 days, received ${projections.length}`);
        failCount++;
      }
    } else {
      logFail(`Forecast endpoint returned HTTP ${forecastRes.status}`);
      failCount++;
    }
  } catch (err) {
    logFail(`LSTM forecast error: ${(err as Error).message}`);
    failCount++;
  }

  // --------------------------------------------------------------------------
  // Summary & Exit Codes
  // --------------------------------------------------------------------------
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n================================================================================");
  console.log(`                           E2E TEST RUNNER SUMMARY                              `);
  console.log("================================================================================");
  console.log(`  Tests Passed:   ${colors.green}${colors.bold}${passCount}${colors.reset}`);
  console.log(`  Tests Failed:   ${failCount > 0 ? colors.red : colors.green}${colors.bold}${failCount}${colors.reset}`);
  console.log(`  Total Duration: ${durationSec}s`);
  console.log("================================================================================\n");

  if (failCount > 0) {
    console.error(`${colors.red}${colors.bold}E2E SYSTEM TEST FAILED with ${failCount} issue(s).${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✔ ALL E2E SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY!${colors.reset}\n`);
    process.exit(0);
  }
}

// Execute Runner
runE2ESystemTest();
