import { PrismaClient, GasType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Sensor Nodes
  const node1 = await prisma.sensorNode.upsert({
    where: { nodeId: 'SN-DEL-001' },
    update: {},
    create: {
      nodeId: 'SN-DEL-001',
      busRouteId: 'ROUTE-42-RING-ROAD',
      status: 'ACTIVE',
      lastCalibrated: new Date('2026-03-01T00:00:00Z'),
      offsetPm25: -2.4,
      offsetCo2: 12.0,
      createdAt: new Date('2026-01-15T00:00:00Z'),
    },
  });

  const node2 = await prisma.sensorNode.upsert({
    where: { nodeId: 'SN-DEL-002' },
    update: {},
    create: {
      nodeId: 'SN-DEL-002',
      busRouteId: 'ROUTE-18-TRANSIT-HUB',
      status: 'ACTIVE',
      lastCalibrated: new Date('2026-03-10T00:00:00Z'),
      offsetPm25: 1.8,
      offsetCo2: -5.5,
      createdAt: new Date('2026-01-20T00:00:00Z'),
    },
  });

  console.log(`✅ Sensor nodes seeded: ${node1.nodeId}, ${node2.nodeId}`);

  // 2. Seed IoT Telemetry Points
  const now = new Date();
  await prisma.iotTelemetry.createMany({
    data: [
      {
        time: now,
        nodeId: node1.nodeId,
        latitude: 28.6315,
        longitude: 77.2167,
        pm2_5: 142.5,
        pm10: 218.0,
        co2: 580.0,
        no2: 45.2,
        voc: 1.2,
        temperature: 31.4,
        humidity: 52.0,
        pressure: 1012.3,
      },
      {
        time: new Date(now.getTime() - 60000),
        nodeId: node2.nodeId,
        latitude: 28.6469,
        longitude: 77.3160,
        pm2_5: 284.1,
        pm10: 382.4,
        co2: 740.0,
        no2: 68.4,
        voc: 2.8,
        temperature: 33.1,
        humidity: 47.0,
        pressure: 1011.8,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ IoT Telemetry sample points seeded.');

  // 3. Seed Satellite Macro Data
  await prisma.satelliteMacroData.create({
    data: {
      capturedAt: now,
      gasType: GasType.CH4,
      rasterTilePath: '/rasters/sentinel5p/20261010_orbit42891_ch4.tif',
      createdAt: now,
    },
  });

  await prisma.satelliteMacroData.create({
    data: {
      capturedAt: now,
      gasType: GasType.CO2,
      rasterTilePath: '/rasters/sentinel5p/20261010_orbit42891_co2.tif',
      createdAt: now,
    },
  });

  console.log('✅ Satellite Macro observations seeded.');

  // 4. Seed Street AQI Grid
  await prisma.$executeRawUnsafe(`
    INSERT INTO "street_aqi_grid" (
      "grid_id", "calculated_at", "street_segment_id", "geometry",
      "interpolated_aqi", "confidence_score", "grid_code", "street_name",
      "current_aqi", "pm2_5", "dominant_pollutant"
    ) VALUES 
    (
      gen_random_uuid(), NOW(), 'SEG-DEL-CP-01',
      ST_GeomFromText('LINESTRING(77.2167 28.6315, 77.2210 28.6340)', 4326),
      158.0, 0.94, 'H3-882681a339fffff', 'Barakhamba Road', 158, 68.4, 'PM2.5'
    ),
    (
      gen_random_uuid(), NOW(), 'SEG-DEL-AV-02',
      ST_GeomFromText('LINESTRING(77.3160 28.6469, 77.3200 28.6500)', 4326),
      215.0, 0.91, 'H3-882681a33bfffff', 'Vikas Marg Corridor', 215, 112.5, 'PM2.5'
    )
    ON CONFLICT ("grid_code") DO NOTHING;
  `);

  console.log('✅ Street AQI Grid line geometries seeded.');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
