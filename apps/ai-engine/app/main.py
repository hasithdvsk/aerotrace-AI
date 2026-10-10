from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import torch

from app.config import settings
from app.routers.kriging import router as kriging_router
from app.routers.forecast import router as forecast_router
from app.routers.calibrate import router as calibrate_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice providing Ordinary Kriging spatial interpolation, PyTorch LSTM AQI forecasting, and mobile bus auto-calibration.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for cross-origin dashboard requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(kriging_router, prefix=settings.API_V1_STR)
app.include_router(forecast_router, prefix=settings.API_V1_STR)
app.include_router(calibrate_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "endpoints": {
            "kriging": f"{settings.API_V1_STR}/kriging",
            "forecast": f"{settings.API_V1_STR}/forecast",
            "calibrate": f"{settings.API_V1_STR}/calibrate",
            "docs": "/docs"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "engine": "fastapi",
        "pytorch": torch.__version__
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
