# aerotrace-AI

A multi-scale satellite & mobile IoT climate intelligence platform that helps people follow healthy travel routes, avoiding localized hotspots of dust, harmful gases, and pollutants.

## Architecture

- **`apps/web`**: **Next.js 16** App Router frontend with **TypeScript** and **Tailwind CSS**, featuring real-time sensor node tracking, TimescaleDB telemetry feeds, Sentinel-5P satellite observations, and PostGIS street grid AQI visualizations.
- **`apps/ai-engine`**: **Python FastAPI** AI & geostatistical microservice with **Ordinary Kriging** street line interpolation, **PyTorch multi-variate LSTM** 14-day forecasting, and mobile bus spatio-temporal auto-calibration.
- **`packages/db`**: **Prisma ORM** configured with the `postgresqlExtensions` preview feature for **PostGIS** and **TimescaleDB**.

## Database Models

1. **`sensor_nodes`**: Deployed stationary and mobile ground IoT stations with PostGIS `geometry(Point, 4326)` coordinates, hardware status, and battery telemetry.
2. **`iot_telemetry`**: High-frequency time-series measurements (`pm2_5`, `pm10`, `no2`, `so2`, `co`, `o3`, temperature, humidity, pressure) partitioned as a TimescaleDB hypertable on `timestamp`.
3. **`satellite_macro_data`**: Regional atmospheric observations (Sentinel-5P TROPOMI & MODIS) storing Aerosol Optical Depth (AOD), tropospheric column densities, and PostGIS `geometry(Polygon, 4326)` bounding footprints.
4. **`street_aqi_grid`**: Hyperlocal H3 / urban polygon grid cells (`geometry(Polygon, 4326)` and `centroid`) computing localized AQI indices with confidence scores.

## Initial Migration

The initial migration is generated at `packages/db/prisma/migrations/0_init/migration.sql` and includes:
- `CREATE EXTENSION IF NOT EXISTS "postgis"`
- `CREATE EXTENSION IF NOT EXISTS "timescaledb"`
- GiST spatial indexing for lightning-fast spatial queries
- Automatic PostGIS geometry and centroid synchronization triggers
- TimescaleDB hypertable conversion for `iot_telemetry`

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL with PostGIS & TimescaleDB extensions enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/hasithdvsk/aerotrace-AI.git
cd aerotrace-AI

# Install dependencies
npm install

# Configure environment
cp packages/db/.env.example packages/db/.env

# Generate Prisma Client
npm run db:generate

# Run development server
npm run dev:web
```
