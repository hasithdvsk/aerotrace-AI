-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable TimescaleDB time-series hypertable extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
