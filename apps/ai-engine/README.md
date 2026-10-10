# AetherGrid AI Engine & Kriging Microservice

High-performance Python FastAPI service providing geostatistical spatial interpolation, multi-variate deep learning AQI forecasting, and mobile bus auto-calibration.

## Architecture

- **Framework**: **FastAPI** + **Uvicorn**
- **Geostatistics**: **Ordinary Kriging** with Spherical, Exponential, and Gaussian semivariogram models for city street polylines.
- **Deep Learning**: **PyTorch** Multi-Variate 2-Layer **LSTM** (AQI, PM2.5, PM10, NO2, Temperature, Humidity, Wind Speed, Pressure).
- **Mobile Calibration**: Spatio-temporal co-location matching for mobile transit bus sensors.
- **Database**: **PostgreSQL** with **PostGIS** and **TimescaleDB** integration.

## API Endpoints

### 1. Ordinary Kriging Spatial Interpolation
- **Method**: `POST /api/v1/kriging`
- **Description**: Fetches recent PostGIS telemetry points and computes Best Linear Unbiased Estimates (BLUE) and estimation variances along city street line geometries.
- **Output**: Standard GeoJSON `FeatureCollection` with `LineString` geometries and localized AQI properties.

### 2. PyTorch LSTM 14-Day AQI Forecast
- **Method**: `POST /api/v1/forecast`
- **Description**: Runs multi-variate LSTM recurrent neural network on historical environmental sequences and prospective weather forecasts to produce a 14-day AQI prediction array with confidence intervals.

### 3. Mobile Bus Co-Location Auto-Calibration
- **Method**: `POST /api/v1/calibrate`
- **Description**: Identifies spatio-temporal intersection encounters between mobile buses ($\le 35\text{m}$, $\le 45\text{s}$) and computes mean bias error offsets and scaling gain multipliers.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Run development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run test suite
pytest tests/test_api.py -v
```
