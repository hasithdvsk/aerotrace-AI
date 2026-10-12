---
description: Production deployment workflow for AeroTrace AI (PostGIS database migrations, Next.js on Vercel, and Python FastAPI on Render/Docker)
globs: 
---

# Production Deployment Workflow for AeroTrace AI

This guide documents the step-by-step production deployment pipeline for the AeroTrace AI multi-tier architecture:
1. **Database Tier:** Managed PostgreSQL with PostGIS & TimescaleDB extensions
2. **Frontend & Ingestion Tier:** Next.js App Router deployed on Vercel
3. **AI Engine Tier:** Python FastAPI microservice (GDAL/GEOS C-extensions) deployed on Render/Docker

---

## 1. PostGIS & TimescaleDB Database Migration

### 1.1 Provision Production Database
Provision a managed PostgreSQL 16 instance with spatial extensions support (AWS RDS, Supabase, Timescale Cloud, or Railway):
- Enable extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
  ```

### 1.2 Run Prisma Migrations
From the repository root or inside `packages/db`:
```bash
# Set production connection string
export DATABASE_URL="postgresql://user:password@prod-db-host:5432/aerotrace_prod?sslmode=require"

# Apply pending schema migrations
npm run db:migrate --workspace=@repo/db
# Or directly via Prisma CLI:
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

### 1.3 Initialize PostGIS Hypertables & Spatial Indices
Execute initial database schema setup script `init-db.sql`:
```bash
psql "$DATABASE_URL" -f init-db.sql
```

Verify hypertable and spatial GiST index creation:
```sql
-- Verify TimescaleDB Hypertable
SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'telemetry_readings';

-- Verify PostGIS Spatial Index
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'telemetry_readings' AND indexname LIKE '%location%';
```

---

## 2. Next.js Web Application Deployment on Vercel

### 2.1 Vercel Project Configuration
- **Repository:** Connect GitHub repository `hasithdvsk/aerotrace-AI`
- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Node.js Version:** `20.x` or `22.x`

### 2.2 Configure Production Environment Variables
Set the following secrets in Vercel Project Settings > Environment Variables:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production | Connection pool string for PostGIS PostgreSQL |
| `DIRECT_URL` | Production | Direct non-pooled connection string for Prisma migrations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Production, Preview | Public Mapbox GL token for high-res vector tiles |
| `AI_ENGINE_URL` | Production | Internal or public URL of FastAPI microservice (e.g. `https://aerotrace-ai-engine.onrender.com`) |
| `NEXT_PUBLIC_AI_ENGINE_URL` | Production | Public API URL for client-side spatial calls |

### 2.3 Deploy & Validate Edge Routes
Deploy via Vercel CLI or Git push to `main`:
```bash
vercel --prod
```

Verify live production routes:
- `https://your-domain.vercel.app/` (Dashboard Overview)
- `https://your-domain.vercel.app/citizen` (Citizen Clean Route Navigation & Dosage Tracker)
- `https://your-domain.vercel.app/dashboard` (Government Portal & UN SDG 11/13 Compliance)
- `https://your-domain.vercel.app/api/telemetry` (LoRaWAN Ingestion Endpoint)

---

## 3. Python FastAPI Cloud Microservice on Render / Docker

### 3.1 Container Build Configuration
The microservice uses a multi-stage Dockerfile located at `apps/ai-engine/Dockerfile`:
- **Stage 1 (Builder):** `python:3.11-slim`, compiles C-dependencies (`libgdal-dev`, `libgeos-dev`, `libproj-dev`, PyTorch CPU).
- **Stage 2 (Runner):** Lightweight runtime container with `libgdal32`, `libgeos-c1v5`, `libpq5`, and non-root execution (`appuser`).

### 3.2 Render Web Service Setup
1. Create a new **Web Service** on [Render.com](https://render.com).
2. Choose **Build and deploy from a Git repository**.
3. Configure settings:
   - **Name:** `aerotrace-ai-engine`
   - **Region:** Frankfurt (EU) or Oregon (US)
   - **Branch:** `main`
   - **Root Directory:** `apps/ai-engine`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Instance Type:** Starter (0.5 CPU, 512 MB RAM) or Standard (1 CPU, 2 GB RAM)
   - **Health Check Path:** `/health`

### 3.3 Production Environment Variables
| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port bound by Uvicorn |
| `PYTHONUNBUFFERED` | `1` | Real-time container log streaming |
| `DATABASE_URL` | `postgresql://...` | TimescaleDB telemetry access string |
| `WORKERS` | `2` | Uvicorn worker process concurrency |

### 3.4 Deploy via Docker CLI (Alternative Self-Hosted)
```bash
cd apps/ai-engine

# Build Docker image
docker build -t aerotrace-ai-engine:latest .

# Run container with resource limits and health checks
docker run -d \
  --name aerotrace_ai \
  -p 8000:8000 \
  -e PORT=8000 \
  -e DATABASE_URL="$DATABASE_URL" \
  --restart always \
  aerotrace-ai-engine:latest
```

---

## 4. Post-Deployment Verification Checklist

Execute the system integration test suite against the target production URLs:

```bash
# Run End-to-End System Test against production
TARGET_WEB_URL="https://your-domain.vercel.app" \
TARGET_AI_URL="https://aerotrace-ai-engine.onrender.com" \
npx ts-node scripts/e2e-system-test.ts
```

- [ ] `POST /api/telemetry` receives payload, applies Kohler normalization, and logs PostGIS geometry.
- [ ] `POST /api/v1/kriging` outputs continuous interpolation grid with $\ge 95\%$ target accuracy.
- [ ] `POST /api/v1/forecast` returns 14-day LSTM projections with peak spikes and heat island detection.
- [ ] Mapbox GL map on `/citizen` renders green Cleanest Route (`#10B981`) and muted alternatives (`#6B7280`).
- [ ] Dosage Tracker Card recalculates personal inhaled dose on transit mode selection.
