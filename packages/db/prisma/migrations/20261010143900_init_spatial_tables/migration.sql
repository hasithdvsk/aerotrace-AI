-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension for TimescaleDB
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- CreateEnum
CREATE TYPE "GasType" AS ENUM ('CH4', 'CO2', 'CO');

-- CreateTable
CREATE TABLE "sensor_nodes" (
    "node_id" VARCHAR(64) NOT NULL,
    "bus_route_id" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "last_calibrated" TIMESTAMPTZ(6),
    "offset_pm25" DOUBLE PRECISION DEFAULT 0.0,
    "offset_co2" DOUBLE PRECISION DEFAULT 0.0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_nodes_pkey" PRIMARY KEY ("node_id")
);

-- CreateTable
CREATE TABLE "iot_telemetry" (
    "id" UUID NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL,
    "node_id" VARCHAR(64) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "location" geometry(Point, 4326),
    "pm2_5" DOUBLE PRECISION,
    "pm10" DOUBLE PRECISION,
    "co2" DOUBLE PRECISION,
    "no2" DOUBLE PRECISION,
    "voc" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,

    CONSTRAINT "iot_telemetry_pkey" PRIMARY KEY ("time","id")
);

-- CreateTable
CREATE TABLE "satellite_macro_data" (
    "id" UUID NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "gas_type" "GasType" NOT NULL,
    "bounding_box" geometry(Polygon, 4326),
    "raster_tile_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellite_macro_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "street_aqi_grid" (
    "grid_id" UUID NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "street_segment_id" VARCHAR(128),
    "geometry" geometry(LineString, 4326) NOT NULL,
    "interpolated_aqi" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "grid_code" VARCHAR(64),
    "street_name" VARCHAR(255),
    "current_aqi" INTEGER,
    "pm2_5" DOUBLE PRECISION,
    "dominant_pollutant" VARCHAR(16),

    CONSTRAINT "street_aqi_grid_pkey" PRIMARY KEY ("grid_id")
);

-- CreateIndex
CREATE INDEX "iot_telemetry_node_id_time_idx" ON "iot_telemetry"("node_id", "time" DESC);
CREATE INDEX "satellite_macro_data_gas_type_captured_at_idx" ON "satellite_macro_data"("gas_type", "captured_at" DESC);
CREATE UNIQUE INDEX "street_aqi_grid_grid_code_key" ON "street_aqi_grid"("grid_code");

-- Spatial GiST Indexes
CREATE INDEX IF NOT EXISTS "iot_telemetry_location_gist_idx" ON "iot_telemetry" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "satellite_macro_data_bounding_box_gist_idx" ON "satellite_macro_data" USING GIST ("bounding_box");
CREATE INDEX IF NOT EXISTS "street_aqi_grid_geometry_gist_idx" ON "street_aqi_grid" USING GIST ("geometry");

-- AddForeignKey
ALTER TABLE "iot_telemetry" ADD CONSTRAINT "iot_telemetry_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "sensor_nodes"("node_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convert iot_telemetry to TimescaleDB Hypertable
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('iot_telemetry', 'time', if_not_exists => TRUE);
    END IF;
END $$;
