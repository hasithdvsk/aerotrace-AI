/**
 * @file simulate-bus-fleet.ts
 * @brief AeroTrace AI - Live Transit Bus Fleet Telemetry Simulator
 *
 * Simulates 5 mobile transit bus sensor nodes traversing key urban corridors in Chennai:
 * - ROUTE-101: Mount Road / Anna Salai Corridor (Chennai Central <-> Guindy Industrial <-> Airport)
 * - ROUTE-204: OMR IT Expressway (Madhya Kailash <-> Perungudi Industrial/Dumpyard <-> Sholinganallur)
 * - ROUTE-309: North Chennai Industrial Belt (Royapuram <-> Manali Petrochemicals <-> Ennore)
 *
 * Active Bus Nodes:
 * - BUS-NODE-101 (Route 101 Forward)
 * - BUS-NODE-102 (Route 101 Offset)
 * - BUS-NODE-201 (Route 204 Forward)
 * - BUS-NODE-202 (Route 204 Offset)
 * - BUS-NODE-301 (Route 309 Industrial Heavy Corridor)
 *
 * Telemetry Payloads:
 * Transmitted every 3 seconds to POST http://localhost:3000/api/telemetry
 */

interface Waypoint {
  name: string;
  lat: number;
  lon: number;
  isSpikeZone?: boolean;
  basePm25: number;
  baseCo2: number;
}

interface TransitRoute {
  routeId: string;
  name: string;
  description: string;
  waypoints: Waypoint[];
}

// ----------------------------------------------------------------------------
// Chennai Transit Corridors Definition
// ----------------------------------------------------------------------------
const CHENNAI_ROUTES: Record<string, TransitRoute> = {
  "ROUTE-101": {
    routeId: "ROUTE-101",
    name: "Anna Salai - Guindy Arterial Corridor",
    description: "Chennai Central Station to Airport via Guindy Industrial Zone",
    waypoints: [
      { name: "Chennai Central Hub", lat: 13.0827, lon: 80.2755, basePm25: 64, baseCo2: 480 },
      { name: "LIC / Anna Salai", lat: 13.0645, lon: 80.2662, basePm25: 58, baseCo2: 460 },
      { name: "Teynampet Signal", lat: 13.0405, lon: 80.2498, basePm25: 52, baseCo2: 440 },
      { name: "Nandanam Junction", lat: 13.0305, lon: 80.2398, basePm25: 75, baseCo2: 520 },
      { name: "Saidapet Bridge", lat: 13.0185, lon: 80.2245, basePm25: 60, baseCo2: 450 },
      { name: "Guindy Industrial Estate", lat: 13.0067, lon: 80.2030, isSpikeZone: true, basePm25: 185, baseCo2: 890 },
      { name: "Kathipara Flyover", lat: 13.0045, lon: 80.1980, basePm25: 98, baseCo2: 610 },
      { name: "Meenambakkam Airport", lat: 12.9856, lon: 80.1705, basePm25: 45, baseCo2: 430 },
    ],
  },
  "ROUTE-204": {
    routeId: "ROUTE-204",
    name: "OMR Tech Expressway",
    description: "Madhya Kailash to Sholinganallur via Perungudi Corridor",
    waypoints: [
      { name: "Madhya Kailash (Adyar)", lat: 13.0082, lon: 80.2565, basePm25: 35, baseCo2: 410 },
      { name: "Tidel Park (Taramani)", lat: 12.9892, lon: 80.2482, basePm25: 48, baseCo2: 440 },
      { name: "Kottivakkam Junction", lat: 12.9785, lon: 80.2468, basePm25: 62, baseCo2: 490 },
      { name: "Perungudi Industrial Corridor", lat: 12.9654, lon: 80.2461, isSpikeZone: true, basePm25: 165, baseCo2: 810 },
      { name: "Thoraipakkam Tollway", lat: 12.9372, lon: 80.2360, basePm25: 78, baseCo2: 540 },
      { name: "Sholinganallur Junction", lat: 12.9010, lon: 80.2279, basePm25: 72, baseCo2: 510 },
    ],
  },
  "ROUTE-309": {
    routeId: "ROUTE-309",
    name: "North Chennai Industrial & Petrochemical Belt",
    description: "Royapuram to Manali Refineries and Ennore Coastal Belt",
    waypoints: [
      { name: "Royapuram Harbor Road", lat: 13.1120, lon: 80.2970, basePm25: 70, baseCo2: 490 },
      { name: "Tondiarpet Rail Terminal", lat: 13.1310, lon: 80.2880, basePm25: 92, baseCo2: 550 },
      { name: "Thiruvottiyur High Road", lat: 13.1610, lon: 80.3010, basePm25: 85, baseCo2: 520 },
      { name: "Manali Petrochemical & Refinery Complex", lat: 13.1750, lon: 80.2680, isSpikeZone: true, basePm25: 265, baseCo2: 1080 },
      { name: "Manali Buffer Zone", lat: 13.1900, lon: 80.2740, isSpikeZone: true, basePm25: 145, baseCo2: 780 },
      { name: "Ennore Port Expressway", lat: 13.2200, lon: 80.3200, isSpikeZone: true, basePm25: 130, baseCo2: 720 },
    ],
  },
};

// ----------------------------------------------------------------------------
// Bus Node Fleet State
// ----------------------------------------------------------------------------
interface BusNodeState {
  nodeId: string;
  routeId: string;
  segmentIndex: number;
  segmentProgress: number; // 0.0 to 1.0
  direction: 1 | -1; // 1 for forward, -1 for reverse
  speedKmh: number;
}

const FLEET_NODES: BusNodeState[] = [
  { nodeId: "BUS-NODE-101", routeId: "ROUTE-101", segmentIndex: 0, segmentProgress: 0.1, direction: 1, speedKmh: 35 },
  { nodeId: "BUS-NODE-102", routeId: "ROUTE-101", segmentIndex: 4, segmentProgress: 0.7, direction: -1, speedKmh: 40 },
  { nodeId: "BUS-NODE-201", routeId: "ROUTE-204", segmentIndex: 0, segmentProgress: 0.2, direction: 1, speedKmh: 45 },
  { nodeId: "BUS-NODE-202", routeId: "ROUTE-204", segmentIndex: 3, segmentProgress: 0.5, direction: -1, speedKmh: 38 },
  { nodeId: "BUS-NODE-301", routeId: "ROUTE-309", segmentIndex: 2, segmentProgress: 0.3, direction: 1, speedKmh: 30 },
];

const TARGET_API_URL = process.env.TELEMETRY_API_URL || "http://localhost:3000/api/telemetry";
const TRANSMIT_INTERVAL_MS = 3000;

// ANSI Colors for logging
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
};

/**
 * Computes position and environmental metrics along route waypoints
 */
function advanceBusNode(node: BusNodeState): {
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  co2: number;
  temp: number;
  hum: number;
  pressure: number;
  isSpike: boolean;
  waypointName: string;
} {
  const route = CHENNAI_ROUTES[node.routeId];
  const wps = route.waypoints;
  const numSegments = wps.length - 1;

  // Advance progress
  const step = 0.05 + Math.random() * 0.04;
  node.segmentProgress += step * node.direction;

  if (node.segmentProgress >= 1.0) {
    if (node.segmentIndex < numSegments - 1) {
      node.segmentIndex++;
      node.segmentProgress = 0.0;
    } else {
      // Reached route terminus, reverse direction
      node.direction = -1;
      node.segmentProgress = 1.0;
    }
  } else if (node.segmentProgress <= 0.0) {
    if (node.segmentIndex > 0) {
      node.segmentIndex--;
      node.segmentProgress = 1.0;
    } else {
      // Reached route start, forward direction
      node.direction = 1;
      node.segmentProgress = 0.0;
    }
  }

  const wpA = wps[node.segmentIndex];
  const wpB = wps[Math.min(node.segmentIndex + 1, numSegments)];
  const t = Math.max(0, Math.min(1, node.segmentProgress));

  // Linear coordinate interpolation
  const lat = wpA.lat + (wpB.lat - wpA.lat) * t + (Math.random() - 0.5) * 0.0003;
  const lon = wpA.lon + (wpB.lon - wpA.lon) * t + (Math.random() - 0.5) * 0.0003;

  // Evaluate pollution characteristics
  const isSpike = !!(wpA.isSpikeZone || wpB.isSpikeZone);
  const basePm = wpA.basePm25 + (wpB.basePm25 - wpA.basePm25) * t;
  const baseCo2 = wpA.baseCo2 + (wpB.baseCo2 - wpA.baseCo2) * t;

  // Sensor noise simulation (PMS5003 fine dust & MQ-135 CO2)
  const pm25Noise = (Math.random() - 0.5) * 8.0;
  const pm25 = Math.max(12, Math.round((basePm + pm25Noise) * 10) / 10);
  const pm10 = Math.round((pm25 * (1.65 + Math.random() * 0.35)) * 10) / 10;
  const co2 = Math.round(baseCo2 + (Math.random() - 0.5) * 35);

  // BME280 temperature & relative humidity (warm coastal tropical climate)
  const tempOffset = isSpike ? 2.5 : 0; // Microclimate thermal heat island
  const temp = Math.round((30.5 + tempOffset + (Math.random() - 0.5) * 1.5) * 10) / 10;
  const hum = Math.round((72.0 + (Math.random() - 0.5) * 8.0) * 10) / 10; // >60% triggers Kohler correction
  const pressure = Math.round((1011.0 + (Math.random() - 0.5) * 2.0) * 10) / 10;

  const currentWpName = t > 0.5 ? wpB.name : wpA.name;

  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lon: Math.round(lon * 1000000) / 1000000,
    pm25,
    pm10,
    co2,
    temp,
    hum,
    pressure,
    isSpike,
    waypointName: currentWpName,
  };
}

/**
 * Transmits a single telemetry payload to the API
 */
async function transmitTelemetry(node: BusNodeState, pulseCount: number): Promise<void> {
  const metrics = advanceBusNode(node);

  const payload = {
    devEui: node.nodeId,
    latitude: metrics.lat,
    longitude: metrics.lon,
    pm2_5: metrics.pm25,
    pm10: metrics.pm10,
    co2: metrics.co2,
    temperature: metrics.temp,
    humidity: metrics.hum,
    pressure: metrics.pressure,
    no2: metrics.isSpike ? 42.0 : 18.5,
    voc: metrics.isSpike ? 280.0 : 95.0,
    batteryVoltage: 3.95,
  };

  const startTime = Date.now();
  try {
    const res = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    const ok = res.ok || res.status === 201;

    // Visual formatting
    const statusTag = ok
      ? `${c.green}[HTTP ${res.status}]${c.reset}`
      : `${c.red}[HTTP ${res.status}]${c.reset}`;

    let aqiBadge = `${c.green}MODERATE${c.reset}`;
    if (metrics.pm25 > 150) {
      aqiBadge = `${c.bgRed}${c.white}${c.bold} HAZARDOUS SPIKE ${c.reset}`;
    } else if (metrics.pm25 > 90) {
      aqiBadge = `${c.yellow}${c.bold}UNHEALTHY${c.reset}`;
    }

    console.log(
      `  ${statusTag} ` +
      `${c.bold}${node.nodeId.padEnd(12)}${c.reset} | ` +
      `${c.cyan}${node.routeId}${c.reset} | ` +
      `GPS: (${metrics.lat.toFixed(4)}, ${metrics.lon.toFixed(4)}) | ` +
      `PM2.5: ${c.bold}${metrics.pm25.toFixed(1)}${c.reset} µg/m³ | ` +
      `CO2: ${metrics.co2} ppm | ` +
      `RH: ${metrics.hum}% | ` +
      `${aqiBadge} ` +
      `${c.dim}(${elapsed}ms, ${metrics.waypointName})${c.reset}`
    );
  } catch (err) {
    console.error(`  ${c.red}[ERR]${c.reset} ${node.nodeId}: ${(err as Error).message}`);
  }
}

/**
 * Main simulator execution loop
 */
async function startFleetSimulation() {
  console.log(`${c.magenta}${c.bold}`);
  console.log("================================================================================");
  console.log("      AeroTrace AI - Live Transit Bus Fleet Telemetry Simulator (Chennai)       ");
  console.log("================================================================================");
  console.log(`${c.reset}`);
  console.log(`  Target Ingestion API: ${c.bold}${TARGET_API_URL}${c.reset}`);
  console.log(`  Transmission Cadence: Every ${TRANSMIT_INTERVAL_MS / 1000} seconds`);
  console.log(`  Active Fleet Nodes:   ${FLEET_NODES.map((n) => n.nodeId).join(", ")}`);
  console.log(`  Active Corridors:     ROUTE-101, ROUTE-204, ROUTE-309 (Manali Industrial Belt)`);
  console.log("--------------------------------------------------------------------------------\n");

  let pulse = 1;

  // Run first cycle immediately
  console.log(`${c.yellow}${c.bold}▶ Telemetry Pulse #${pulse} [${new Date().toLocaleTimeString()}]${c.reset}`);
  await Promise.all(FLEET_NODES.map((node) => transmitTelemetry(node, pulse)));
  pulse++;

  // Recurring transmission interval
  setInterval(async () => {
    console.log(`\n${c.yellow}${c.bold}▶ Telemetry Pulse #${pulse} [${new Date().toLocaleTimeString()}]${c.reset}`);
    await Promise.all(FLEET_NODES.map((node) => transmitTelemetry(node, pulse)));
    pulse++;
  }, TRANSMIT_INTERVAL_MS);
}

// Start simulation
startFleetSimulation();
