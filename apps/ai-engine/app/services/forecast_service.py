from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from app.models.schemas import (
    ForecastRequest,
    ForecastResponse,
    ForecastDayItem,
    ConfidenceInterval,
    ForecastWeatherAssumptions,
    HistoricalDataPoint
)
from app.models.lstm_model import run_lstm_inference

def generate_default_history(station_id: str) -> List[HistoricalDataPoint]:
    """Generates baseline 14-day historical environmental time-series for inference."""
    now = datetime.now(timezone.utc)
    history = []
    
    # Base baseline parameters depending on station
    base_aqi = 168.0 if "DEL" in station_id else 145.0
    
    for i in range(14, 0, -1):
        dt = now - timedelta(days=i)
        # Seasonal/diurnal cycle variation
        cycle = math_sin_variation(i)
        aqi = max(50.0, base_aqi + cycle * 12.0)
        pm25 = round(aqi / 2.3, 1)
        pm10 = round(pm25 * 1.85, 1)
        no2 = round(42.0 + cycle * 6.0, 1)
        temp = round(28.5 + cycle * 1.5, 1)
        humidity = round(56.0 - cycle * 4.0, 1)
        wind = round(11.5 + cycle * 2.0, 1)
        pressure = round(1012.0 + cycle * 0.8, 1)

        history.append(HistoricalDataPoint(
            timestamp=dt,
            aqi=aqi,
            pm2_5=pm25,
            pm10=pm10,
            no2=no2,
            temperature=temp,
            humidity=humidity,
            wind_speed=wind,
            pressure=pressure
        ))
    return history

def math_sin_variation(step: int) -> float:
    import math
    return math.sin(step * 0.45)

def execute_aqi_forecast(request: ForecastRequest) -> ForecastResponse:
    """
    Executes PyTorch LSTM inference pipeline over historical multi-variable data.
    Returns 14-day forecast array.
    """
    history = request.historical_series or generate_default_history(request.station_id)
    
    # Extract feature matrix [T, 8]
    feature_matrix = [
        [
            dp.aqi,
            dp.pm2_5,
            dp.pm10,
            dp.no2,
            dp.temperature,
            dp.humidity,
            dp.wind_speed,
            dp.pressure
        ]
        for dp in history
    ]

    # Generate prospective 14-day weather assumptions (meteorological forecasts)
    future_weather = []
    base_temp = history[-1].temperature
    base_hum = history[-1].humidity
    base_wind = history[-1].wind_speed

    for day in range(1, request.forecast_days + 1):
        temp = round(base_temp + math_sin_variation(day) * 1.8, 1)
        hum = round(max(30.0, min(95.0, base_hum - math_sin_variation(day) * 3.5)), 1)
        wind = round(max(4.0, base_wind + math_sin_variation(day + 2) * 2.2), 1)
        future_weather.append({
            "temp_c": temp,
            "humidity_pct": hum,
            "wind_speed_kmh": wind
        })

    # Run PyTorch LSTM neural inference
    raw_predictions = run_lstm_inference(
        historical_matrix=feature_matrix,
        future_weather_features=future_weather,
        forecast_days=request.forecast_days
    )

    now = datetime.now(timezone.utc)
    forecast_items: List[ForecastDayItem] = []

    for pred in raw_predictions:
        day_num = pred["day"]
        target_date = (now + timedelta(days=day_num)).strftime("%Y-%m-%d")
        w = pred["weather"]

        forecast_items.append(ForecastDayItem(
            day=day_num,
            date=target_date,
            predicted_aqi=pred["predicted_aqi"],
            predicted_pm25=pred["predicted_pm25"],
            predicted_pm10=pred["predicted_pm10"],
            category=pred["category"],
            confidence_interval=ConfidenceInterval(
                lower=pred["lower_bound"],
                upper=pred["upper_bound"]
            ),
            weather_assumptions=ForecastWeatherAssumptions(
                temperature_c=w["temp_c"],
                humidity_pct=w["humidity_pct"],
                wind_speed_kmh=w["wind_speed_kmh"]
            )
        ))

    # Trend analysis: compare initial 3-day average vs final 3-day average
    early_avg = sum(f.predicted_aqi for f in forecast_items[:3]) / 3.0
    late_avg = sum(f.predicted_aqi for f in forecast_items[-3:]) / 3.0
    diff = late_avg - early_avg

    if diff < -8.0:
        trend = "Improving (air quality expected to clear due to increasing dispersion velocity)"
    elif diff > 8.0:
        trend = "Deteriorating (accumulation of particulates anticipated under stagnant boundary layer)"
    else:
        trend = "Stable (moderate conditions persisting within regular diurnal bands)"

    total_avg_aqi = int(round(sum(f.predicted_aqi for f in forecast_items) / len(forecast_items)))

    return ForecastResponse(
        status="success",
        station_id=request.station_id,
        city=request.city,
        model_architecture="PyTorch Multi-Variate LSTM (2-layer, 64 hidden units)",
        forecast_horizon_days=request.forecast_days,
        forecast=forecast_items,
        trend_analysis=trend,
        average_predicted_aqi=total_avg_aqi
    )
