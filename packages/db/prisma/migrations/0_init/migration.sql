-- ============================================================================
-- Initial Migration: PostGIS & TimescaleDB Configuration
-- Tables: sensor_nodes, iot_telemetry, satellite_macro_data, street_aqi_grid
-- ============================================================================

-- 1. Enable Required Extensions
-- PostGIS for geospatial analysis (geometries, spatial indexing, distance queries)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- TimescaleDB for high-throughput time-series optimization (conditional load)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB extension could not be loaded directly or is not installed in the database: %', SQLERRM;
END $$;

-- 2. Create Enumerated Types
CREATE TYPE "NodeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CALIBRATING', 'OFFLINE');
CREATE TYPE "NodeType" AS ENUM ('STATIONARY', 'MOBILE', 'CALIBRATION_REF');

-- 3. Create sensor_nodes Table
CREATE TABLE "sensor_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "status" "NodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "node_type" "NodeType" NOT NULL DEFAULT 'STATIONARY',
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "altitude_meters" DOUBLE PRECISION,
    "location" geometry(Point, 4326),
    "hardware_version" VARCHAR(64),
    "firmware_version" VARCHAR(64),
    "battery_level" DOUBLE PRECISION,
    "metadata" JSONB,
    "installed_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_nodes_pkey" PRIMARY KEY ("id")
);

-- Unique index on node_code
CREATE UNIQUE INDEX "sensor_nodes_node_code_key" ON "sensor_nodes"("node_code");

-- B-Tree indices for filtering
CREATE INDEX "sensor_nodes_status_idx" ON "sensor_nodes"("status");
CREATE INDEX "sensor_nodes_node_type_idx" ON "sensor_nodes"("node_type");

-- PostGIS GiST index for spatial queries
CREATE INDEX "sensor_nodes_location_gist_idx" ON "sensor_nodes" USING GIST ("location");

-- PostGIS Trigger to automatically populate location Point from latitude/longitude
CREATE OR REPLACE FUNCTION sync_sensor_node_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_sensor_node_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON "sensor_nodes"
FOR EACH ROW
EXECUTE FUNCTION sync_sensor_node_location();

-- 4. Create iot_telemetry Table
CREATE TABLE "iot_telemetry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "node_id" UUID NOT NULL,
    "pm2_5" DOUBLE PRECISION,
    "pm10" DOUBLE PRECISION,
    "no2" DOUBLE PRECISION,
    "so2" DOUBLE PRECISION,
    "co" DOUBLE PRECISION,
    "o3" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "wind_speed" DOUBLE PRECISION,
    "wind_direction" DOUBLE PRECISION,
    "battery_voltage" DOUBLE PRECISION,
    "rssi" INTEGER,
    "aqi_calculated" INTEGER,
    "raw_payload" JSONB,

    CONSTRAINT "iot_telemetry_pkey" PRIMARY KEY ("timestamp", "id"),
    CONSTRAINT "iot_telemetry_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "sensor_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Fast lookup for node-specific time ranges
CREATE INDEX "iot_telemetry_node_id_timestamp_idx" ON "iot_telemetry"("node_id", "timestamp" DESC);

-- Convert iot_telemetry to TimescaleDB Hypertable
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('iot_telemetry', 'timestamp', if_not_exists => TRUE);
        RAISE NOTICE 'Successfully partitioned iot_telemetry into TimescaleDB hypertable.';
    ELSE
        RAISE NOTICE 'TimescaleDB extension not active; table created as standard time-indexed relation.';
    END IF;
END $$;

-- 5. Create satellite_macro_data Table
CREATE TABLE "satellite_macro_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "satellite_source" VARCHAR(64) NOT NULL,
    "granule_id" VARCHAR(128),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "coverage_area" geometry(Polygon, 4326),
    "aod" DOUBLE PRECISION,
    "no2_column_density" DOUBLE PRECISION,
    "so2_column_density" DOUBLE PRECISION,
    "co_column_density" DOUBLE PRECISION,
    "pm25_estimate" DOUBLE PRECISION,
    "cloud_fraction" DOUBLE PRECISION,
    "spatial_resolution_km" DOUBLE PRECISION,
    "raw_data_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellite_macro_data_pkey" PRIMARY KEY ("id")
);

-- Spatial and temporal indices for satellite data
CREATE INDEX "satellite_macro_data_coverage_area_gist_idx" ON "satellite_macro_data" USING GIST ("coverage_area");
CREATE INDEX "satellite_macro_data_satellite_source_timestamp_idx" ON "satellite_macro_data"("satellite_source", "timestamp" DESC);

-- 6. Create street_aqi_grid Table
CREATE TABLE "street_aqi_grid" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grid_code" VARCHAR(64) NOT NULL,
    "street_name" VARCHAR(255),
    "neighborhood" VARCHAR(128),
    "city" VARCHAR(100) NOT NULL DEFAULT 'Default City',
    "geometry" geometry(Polygon, 4326) NOT NULL,
    "centroid" geometry(Point, 4326),
    "current_aqi" INTEGER NOT NULL,
    "aqi_category" VARCHAR(32),
    "dominant_pollutant" VARCHAR(16),
    "pm2_5" DOUBLE PRECISION,
    "pm10" DOUBLE PRECISION,
    "no2" DOUBLE PRECISION,
    "confidence_score" DOUBLE PRECISION,
    "last_calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "street_aqi_grid_pkey" PRIMARY KEY ("id")
);

-- Unique index on grid identifier (e.g. H3 index)
CREATE UNIQUE INDEX "street_aqi_grid_grid_code_key" ON "street_aqi_grid"("grid_code");

-- Spatial GiST indices for fast bounding-box & containment lookups
CREATE INDEX "street_aqi_grid_geometry_gist_idx" ON "street_aqi_grid" USING GIST ("geometry");
CREATE INDEX "street_aqi_grid_centroid_gist_idx" ON "street_aqi_grid" USING GIST ("centroid");

-- Value lookup indices
CREATE INDEX "street_aqi_grid_current_aqi_idx" ON "street_aqi_grid"("current_aqi");
CREATE INDEX "street_aqi_grid_city_idx" ON "street_aqi_grid"("city");

-- PostGIS Trigger to automatically calculate centroid if not supplied
CREATE OR REPLACE FUNCTION sync_grid_centroid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.geometry IS NOT NULL AND NEW.centroid IS NULL THEN
        NEW.centroid := ST_Centroid(NEW.geometry);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_grid_centroid
BEFORE INSERT OR UPDATE OF geometry ON "street_aqi_grid"
FOR EACH ROW
EXECUTE FUNCTION sync_grid_centroid();
