from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# ============================================================================
# 1. Kriging Spatial Interpolation Schemas
# ============================================================================

class StreetInput(BaseModel):
    street_id: str
    street_name: str
    coordinates: List[List[float]] = Field(
        ...,
        description="Array of [longitude, latitude] coordinates forming the street polyline"
    )

class TelemetryPoint(BaseModel):
    node_code: str
    latitude: float
    longitude: float
    value: float
    timestamp: Optional[datetime] = None
    node_type: Optional[str] = "STATIONARY"

class LineStringGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]

class StreetFeatureProperties(BaseModel):
    street_id: str
    street_name: str
    interpolated_aqi: int
    interpolated_pm25: float
    variance: float
    confidence_score: float
    aqi_category: str
    dominant_pollutant: str = "PM2.5"

class StreetLineFeature(BaseModel):
    type: str = "Feature"
    geometry: LineStringGeometry
    properties: StreetFeatureProperties

class KrigingRequest(BaseModel):
    city: str = "New Delhi"
    parameter: str = Field("aqi", description="Target interpolation parameter: 'aqi', 'pm2_5', 'pm10'")
    time_window_minutes: int = Field(60, description="PostGIS query time window in minutes")
    streets: Optional[List[StreetInput]] = None
    custom_points: Optional[List[TelemetryPoint]] = None
    variogram_model: Optional[str] = "spherical"

class KrigingResponse(BaseModel):
    status: str
    city: str
    parameter: str
    points_sampled_count: int
    streets_interpolated_count: int
    kriging_model: str
    geojson: Dict[str, Any]
    generated_at: datetime = Field(default_factory=utc_now)

# ============================================================================
# 2. PyTorch LSTM Forecast Schemas
# ============================================================================

class HistoricalDataPoint(BaseModel):
    timestamp: datetime
    aqi: float
    pm2_5: float
    pm10: float
    no2: float
    temperature: float
    humidity: float
    wind_speed: float
    pressure: float

class ConfidenceInterval(BaseModel):
    lower: int
    upper: int

class ForecastWeatherAssumptions(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float

class ForecastDayItem(BaseModel):
    day: int
    date: str
    predicted_aqi: int
    predicted_pm25: float
    predicted_pm10: float
    category: str
    confidence_interval: ConfidenceInterval
    weather_assumptions: ForecastWeatherAssumptions

class ForecastRequest(BaseModel):
    station_id: str = "SN-DEL-001"
    city: str = "New Delhi"
    forecast_days: int = Field(14, ge=1, le=30, description="Forecast horizon in days (default: 14)")
    historical_series: Optional[List[HistoricalDataPoint]] = None

class ForecastResponse(BaseModel):
    status: str
    station_id: str
    city: str
    model_architecture: str = "PyTorch Multi-Variate LSTM (2-layer, 64 hidden units)"
    forecast_horizon_days: int = 14
    forecast: List[ForecastDayItem]
    trend_analysis: str
    average_predicted_aqi: int
    generated_at: datetime = Field(default_factory=utc_now)

# ============================================================================
# 3. Mobile Bus Auto-Calibration Schemas
# ============================================================================

class BusObservation(BaseModel):
    node_code: str
    bus_route_id: Optional[str] = None
    timestamp: datetime
    latitude: float
    longitude: float
    pm2_5: float
    pm10: float
    co2: float
    temperature: float
    humidity: float

class NodeCalibrationOffset(BaseModel):
    target_node_code: str
    reference_node_code: str
    intersection_timestamp: datetime
    distance_meters: float
    intersection_coordinates: List[float]
    raw_pm25_target: float
    raw_pm25_reference: float
    pm25_offset: float
    pm10_offset: float
    co2_offset: float
    gain_scale_factor: float
    confidence_score: float

class CalibrationRequest(BaseModel):
    time_window_hours: int = Field(24, ge=1, le=168)
    max_distance_meters: float = Field(35.0, description="Spatial proximity threshold for bus encounter")
    max_time_delta_seconds: float = Field(45.0, description="Temporal coincidence threshold")
    custom_observations: Optional[List[BusObservation]] = None

class CalibrationResponse(BaseModel):
    status: str
    time_window_hours: int
    intersections_detected: int
    calibrated_node_pairs: int
    calibration_offsets: List[NodeCalibrationOffset]
    summary_matrix: Dict[str, Any]
    generated_at: datetime = Field(default_factory=utc_now)
