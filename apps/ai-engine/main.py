"""
AeroTrace AI - Cloud AI Microservice Entrypoint
Exposes Ordinary Kriging spatial interpolation, PyTorch 14-day LSTM forecasting,
and mobile bus intersection auto-calibration endpoints.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import torch

from services.kriging import kriging_service
from services.lstm import forecasting_service
from services.calibration import calibration_service

app = FastAPI(
    title="AeroTrace AI Cloud Microservice",
    version="1.0.0",
    description="Spatial Ordinary Kriging interpolation, PyTorch 14-day LSTM AQI & heat island forecasting, and mobile bus intersection auto-calibration.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Request Models
# ============================================================================

class KrigingRequest(BaseModel):
    observations: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="List of sensor observations with longitude, latitude, and pollutant values.",
    )
    grid_resolution: int = Field(
        default=25,
        ge=5,
        le=100,
        description="Grid steps along latitude and longitude axes.",
    )
    target_pollutant: str = Field(
        default="pm2_5",
        description="Target measurement to interpolate ('pm2_5', 'pm10', 'current_aqi').",
    )
    custom_bounds: Optional[List[float]] = Field(
        default=None,
        description="Optional spatial bounds [min_lon, min_lat, max_lon, max_lat].",
    )


class ForecastRequest(BaseModel):
    node_id: str = Field(
        default="SN-DEL-001",
        description="Unique sensor node identifier or mobile transit bus code.",
    )
    historical_telemetry: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional preceding time-series telemetry sequence.",
    )


class CalibrationRequest(BaseModel):
    telemetry_samples: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Recent mobile transit bus telemetry points with GPS and timestamps.",
    )
    existing_node_offsets: Optional[Dict[str, Dict[str, float]]] = Field(
        default=None,
        description="Current sensor offsets {node_id: {offset_pm25, offset_co2}}.",
    )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "AeroTrace AI Cloud Microservice",
        "version": "1.0.0",
        "status": "operational",
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "endpoints": {
            "health": "/health",
            "kriging": "/api/v1/kriging",
            "forecast": "/api/v1/forecast",
            "calibrate": "/api/v1/calibrate",
            "docs": "/docs",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Service health check route."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "engine": "FastAPI",
        "pytorch": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "services": {
            "ordinary_kriging": "ACTIVE",
            "lstm_forecaster": "ACTIVE",
            "bus_calibration": "ACTIVE",
        },
    }


@app.post("/api/v1/kriging", status_code=status.HTTP_200_OK, tags=["Spatial AI"])
def calculate_kriging(req: KrigingRequest):
    """
    Triggers Ordinary Kriging spatial correlation and generates continuous
    geostatistical interpolations over urban grid topologies with >95% target accuracy.
    """
    bounds_tuple = tuple(req.custom_bounds) if req.custom_bounds and len(req.custom_bounds) == 4 else None

    result = kriging_service.execute_ordinary_kriging(
        observations=req.observations,
        grid_resolution=req.grid_resolution,
        target_pollutant=req.target_pollutant,
        custom_bounds=bounds_tuple,
    )
    return result


@app.post("/api/v1/forecast", status_code=status.HTTP_200_OK, tags=["Temporal AI"])
def generate_forecast(req: ForecastRequest):
    """
    Accepts node_id and multi-variable time-series telemetry (PM2.5, PM10, Temp, Humidity, Pressure)
    to output a 14-day advance forecast of localized AQI spikes and micro-climate heat islands.
    """
    result = forecasting_service.predict_14_day_forecast(
        node_id=req.node_id,
        historical_telemetry=req.historical_telemetry,
    )
    return result


def _background_calibration_worker(telemetry_samples, existing_offsets):
    """Background task executing consensus calibration calculations."""
    calibration_service.find_intersections_and_calibrate(
        telemetry_samples=telemetry_samples,
        existing_node_offsets=existing_offsets,
    )


@app.post("/api/v1/calibrate", status_code=status.HTTP_200_OK, tags=["Edge Calibration"])
def trigger_calibration(req: CalibrationRequest, background_tasks: BackgroundTasks):
    """
    Executes intersection cross-checking algorithm detecting when two bus nodes
    come within 15 meters of each other and updates offset calibration parameters.
    """
    # Run immediate consensus check to return result summary
    result = calibration_service.find_intersections_and_calibrate(
        telemetry_samples=req.telemetry_samples,
        existing_node_offsets=req.existing_node_offsets,
    )

    # Queue persistent background maintenance task
    background_tasks.add_task(
        _background_calibration_worker,
        req.telemetry_samples,
        req.existing_node_offsets,
    )

    return {
        "status": "accepted",
        "job_id": f"CALIB-{int(datetime.now(timezone.utc).timestamp())}",
        "message": f"Processed {result['total_encounters_detected']} intersecting encounters within 15m. Calibrated {result['nodes_calibrated_count']} nodes.",
        "calibration_results": result,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
