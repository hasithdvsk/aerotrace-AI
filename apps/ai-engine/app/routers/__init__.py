from app.routers.kriging import router as kriging_router
from app.routers.forecast import router as forecast_router
from app.routers.calibrate import router as calibrate_router

__all__ = ["kriging_router", "forecast_router", "calibrate_router"]
