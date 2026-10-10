import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "pytorch" in data

def test_kriging_endpoint():
    payload = {
        "city": "New Delhi",
        "parameter": "aqi",
        "time_window_minutes": 60,
        "variogram_model": "spherical"
    }
    response = client.post("/api/v1/kriging", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["city"] == "New Delhi"
    assert data["points_sampled_count"] >= 2
    assert "geojson" in data
    geojson = data["geojson"]
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) > 0

    # Verify GeoJSON LineString structure
    first_feature = geojson["features"][0]
    assert first_feature["type"] == "Feature"
    assert first_feature["geometry"]["type"] == "LineString"
    assert "interpolated_aqi" in first_feature["properties"]
    assert "variance" in first_feature["properties"]
    assert "confidence_score" in first_feature["properties"]
    print(f"\n[Kriging Test] Interpolated {len(geojson['features'])} city street lines. First street: {first_feature['properties']['street_name']} (AQI: {first_feature['properties']['interpolated_aqi']})")

def test_forecast_endpoint():
    payload = {
        "station_id": "SN-DEL-001",
        "city": "New Delhi",
        "forecast_days": 14
    }
    response = client.post("/api/v1/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["forecast_horizon_days"] == 14
    assert len(data["forecast"]) == 14
    assert "PyTorch" in data["model_architecture"]

    # Verify day items
    first_day = data["forecast"][0]
    assert first_day["day"] == 1
    assert "predicted_aqi" in first_day
    assert "confidence_interval" in first_day
    assert "weather_assumptions" in first_day
    print(f"\n[Forecast Test] 14-day LSTM forecast generated. Avg AQI: {data['average_predicted_aqi']}, Trend: {data['trend_analysis']}")

def test_calibrate_endpoint():
    payload = {
        "time_window_hours": 24,
        "max_distance_meters": 35.0,
        "max_time_delta_seconds": 45.0
    }
    response = client.post("/api/v1/calibrate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["intersections_detected"] >= 1
    assert len(data["calibration_offsets"]) >= 1
    
    first_offset = data["calibration_offsets"][0]
    assert "pm25_offset" in first_offset
    assert "gain_scale_factor" in first_offset
    assert "confidence_score" in first_offset
    print(f"\n[Calibrate Test] Detected {data['intersections_detected']} bus intersection encounters. Offset: {first_offset['pm25_offset']} µg/m³ (Target: {first_offset['target_node_code']}, Ref: {first_offset['reference_node_code']})")

if __name__ == "__main__":
    test_health_check()
    test_kriging_endpoint()
    test_forecast_endpoint()
    test_calibrate_endpoint()
    print("\n🎉 ALL FASTAPI MICROSERVICE TESTS PASSED SUCCESSFULLY!")
