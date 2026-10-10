from fastapi import APIRouter, HTTPException
from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast_service import execute_aqi_forecast

router = APIRouter(prefix="/forecast", tags=["AQI Deep Learning Forecast"])

@router.post("", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """
    Executes a PyTorch multi-variate LSTM model trained on historical AQI
    and meteorological parameters (temp, humidity, wind, pressure) to return
    a 14-day forecast array with confidence intervals.
    """
    try:
        if request.forecast_days < 1 or request.forecast_days > 30:
            raise HTTPException(
                status_code=400,
                detail="Forecast horizon must be between 1 and 30 days."
            )

        response = execute_aqi_forecast(request)
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LSTM forecasting failed: {str(e)}"
        )
