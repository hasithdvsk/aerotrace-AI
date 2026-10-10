import os
from typing import Optional

class Settings:
    PROJECT_NAME: str = "AetherGrid AI Engine & Kriging Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/aqi_intelligence?schema=public"
    )
    
    # Kriging Hyperparameters
    KRIGING_VARIOGRAM_MODEL: str = os.getenv("KRIGING_VARIOGRAM_MODEL", "spherical")
    KRIGING_RANGE_KM: float = float(os.getenv("KRIGING_RANGE_KM", "6.5"))
    KRIGING_NUGGET: float = float(os.getenv("KRIGING_NUGGET", "5.0"))
    KRIGING_SILL: float = float(os.getenv("KRIGING_SILL", "120.0"))
    
    # LSTM Forecasting Hyperparameters
    LSTM_INPUT_DIM: int = 8
    LSTM_HIDDEN_DIM: int = 64
    LSTM_NUM_LAYERS: int = 2
    LSTM_FORECAST_DAYS: int = 14
    
    # Mobile Calibration Parameters
    BUS_INTERSECTION_MAX_DISTANCE_METERS: float = float(os.getenv("BUS_CALIBRATION_DISTANCE_METERS", "35.0"))
    BUS_INTERSECTION_MAX_TIME_DELTA_SEC: float = float(os.getenv("BUS_CALIBRATION_TIME_DELTA_SEC", "45.0"))

settings = Settings()
