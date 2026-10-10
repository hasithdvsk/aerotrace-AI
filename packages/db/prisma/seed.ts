import { PrismaClient, NodeStatus, NodeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Sensor Node
  const node1 = await prisma.sensorNode.upsert({
    where: { nodeCode: 'SN-DEL-001' },
    update: {},
    create: {
      nodeCode: 'SN-DEL-001',
      name: 'Connaught Place Central Station',
      description: 'Solar-powered multi-gas & PM sensor array at high-density commercial intersection',
      status: NodeStatus.ACTIVE,
      nodeType: NodeType.STATIONARY,
      latitude: 28.6315,
      longitude: 77.2167,
      altitudeMeters: 216.0,
      hardwareVersion: 'v2.4-solar',
      firmwareVersion: '1.8.2',
      batteryLevel: 94.5,
      installedAt: new Date('2026-01-15T00:00:00Z'),
      lastSeenAt: new Date(),
      metadata: {
        connectivity: '4G-LTE',
        sensors: ['PMS5003', 'BME680', 'SPEC-NO2', 'SPEC-SO2'],
        owner: 'Municipal Environmental Protection Dept'
      }
    }
  });

  const node2 = await prisma.sensorNode.upsert({
    where: { nodeCode: 'SN-DEL-002' },
    update: {},
    create: {
      nodeCode: 'SN-DEL-002',
      name: 'Anand Vihar Transit Hub',
      description: 'Heavy vehicular traffic and interstate bus terminus perimeter node',
      status: NodeStatus.ACTIVE,
      nodeType: NodeType.STATIONARY,
      latitude: 28.6469,
      longitude: 77.3160,
      altitudeMeters: 208.5,
      hardwareVersion: 'v2.4-grid',
      firmwareVersion: '1.8.2',
      batteryLevel: 100.0,
      installedAt: new Date('2026-01-20T00:00:00Z'),
      lastSeenAt: new Date(),
      metadata: {
        connectivity: 'Ethernet + 4G Fallback',
        sensors: ['PMS7003', 'Alphasense-OPC-N3', 'CityTech-4Gas'],
        owner: 'Pollution Control Committee'
      }
    }
  });

  console.log(`✅ Sensor nodes seeded: ${node1.nodeCode}, ${node2.nodeCode}`);

  // 2. Seed IoT Telemetry (Timeseries)
  const now = new Date();
  await prisma.iotTelemetry.createMany({
    data: [
      {
        nodeId: node1.id,
        timestamp: new Date(now.getTime() - 60000 * 30),
        pm25: 68.4,
        pm10: 142.1,
        no2: 45.2,
        so2: 12.8,
        co: 1.1,
        o3: 28.3,
        temperature: 27.4,
        humidity: 58.0,
        pressure: 1012.3,
        windSpeed: 2.1,
        windDirection: 145.0,
        batteryVoltage: 4.12,
        rssi: -65,
        aqiCalculated: 158
      },
      {
        nodeId: node1.id,
        timestamp: new Date(now.getTime() - 60000 * 15),
        pm25: 72.1,
        pm10: 155.0,
        no2: 48.0,
        so2: 14.1,
        co: 1.2,
        o3: 26.5,
        temperature: 28.1,
        humidity: 56.5,
        pressure: 1011.8,
        windSpeed: 1.8,
        windDirection: 150.0,
        batteryVoltage: 4.10,
        rssi: -66,
        aqiCalculated: 162
      },
      {
        nodeId: node2.id,
        timestamp: now,
        pm25: 112.5,
        pm10: 235.8,
        no2: 78.4,
        so2: 24.2,
        co: 2.4,
        o3: 31.0,
        temperature: 29.0,
        humidity: 52.0,
        pressure: 1011.0,
        windSpeed: 1.2,
        windDirection: 110.0,
        batteryVoltage: 4.19,
        rssi: -58,
        aqiCalculated: 215
      }
    ]
  });
  console.log('✅ IoT Telemetry samples seeded.');

  // 3. Seed Satellite Macro Data
  await prisma.satelliteMacroData.create({
    data: {
      satelliteSource: 'SENTINEL-5P-TROPOMI',
      granuleId: 'S5P_RPRO_L2__AER_AI_20261010T080000',
      timestamp: new Date(now.getTime() - 3600000 * 3),
      aod: 0.58,
      no2ColumnDensity: 0.000142,
      so2ColumnDensity: 0.000035,
      coColumnDensity: 0.038,
      pm25Estimate: 78.2,
      cloudFraction: 0.12,
      spatialResolutionKm: 3.5,
      rawDataUrl: 'https://sentinel-hub.example/data/tropomi/delhi-ncr-20261010.nc',
      metadata: {
        orbit: 35812,
        qa_value: 0.88,
        sensor: 'TROPOMI'
      }
    }
  });
  console.log('✅ Satellite Macro Data seeded.');

  // 4. Seed Street AQI Grid
  await prisma.streetAqiGrid.upsert({
    where: { gridCode: 'H3-882681a339fffff' },
    update: {},
    create: {
      gridCode: 'H3-882681a339fffff',
      streetName: 'Barakhamba Road',
      neighborhood: 'Connaught Place',
      city: 'New Delhi',
      currentAqi: 158,
      aqiCategory: 'Unhealthy for Sensitive Groups',
      dominantPollutant: 'PM2.5',
      pm25: 68.4,
      pm10: 142.1,
      no2: 45.2,
      confidenceScore: 0.94,
      lastCalculatedAt: now
    }
  });

  await prisma.streetAqiGrid.upsert({
    where: { gridCode: 'H3-882681a33bfffff' },
    update: {},
    create: {
      gridCode: 'H3-882681a33bfffff',
      streetName: 'Vikas Marg / Anand Vihar Corridor',
      neighborhood: 'Anand Vihar',
      city: 'New Delhi',
      currentAqi: 215,
      aqiCategory: 'Very Unhealthy',
      dominantPollutant: 'PM2.5',
      pm25: 112.5,
      pm10: 235.8,
      no2: 78.4,
      confidenceScore: 0.91,
      lastCalculatedAt: now
    }
  });
  console.log('✅ Street AQI Grid seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
