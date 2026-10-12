import sys
import json
import httpx

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("=================================================================")
    print("[TEST] Testing AeroTrace AI Cloud Microservice at", BASE_URL)
    print("=================================================================\n")

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Health Check
    print("1. [GET /health]")
    res_health = client.get("/health")
    print(f"   Status: {res_health.status_code}")
    print(f"   Response: {json.dumps(res_health.json(), indent=2)}\n")
    assert res_health.status_code == 200, "Health check failed"

    # 2. Kriging Spatial Grid Calculation
    print("2. [POST /api/v1/kriging]")
    kriging_payload = {
        "observations": [
            {"nodeId": "SN-DEL-001", "longitude": 77.2167, "latitude": 28.6315, "pm2_5": 142.5},
            {"nodeId": "SN-DEL-002", "longitude": 77.3160, "latitude": 28.6469, "pm2_5": 284.1},
            {"nodeId": "SN-DEL-003", "longitude": 77.2732, "latitude": 28.5355, "pm2_5": 312.8},
            {"nodeId": "SN-DEL-004", "longitude": 77.2197, "latitude": 28.5933, "pm2_5": 58.4},
            {"nodeId": "SN-DEL-005", "longitude": 77.2341, "latitude": 28.5822, "pm2_5": 198.3},
        ],
        "grid_resolution": 20,
        "target_pollutant": "pm2_5"
    }
    res_kriging = client.post("/api/v1/kriging", json=kriging_payload)
    print(f"   Status: {res_kriging.status_code}")
    kriging_data = res_kriging.json()
    print(f"   Algorithm: {kriging_data.get('algorithm')}")
    print(f"   Variogram Model: {kriging_data.get('variogram_model')}")
    print(f"   Spatial Accuracy: {kriging_data.get('spatial_accuracy')}% (Target >95%: {kriging_data.get('target_accuracy_met')})")
    print(f"   Grid Resolution: {kriging_data.get('grid_resolution')}")
    print(f"   Summary Statistics: {kriging_data.get('summary_statistics')}")
    print(f"   Total GeoJSON Features: {len(kriging_data.get('geojson', {}).get('features', []))}\n")
    assert res_kriging.status_code == 200, "Kriging endpoint failed"

    # 3. 14-Day LSTM Forecasting
    print("3. [POST /api/v1/forecast]")
    forecast_payload = {
        "node_id": "SN-DEL-001",
        "historical_telemetry": [
            {"pm2_5": 135.0, "pm10": 210.0, "temperature": 31.5, "humidity": 52.0, "pressure": 1012.4},
            {"pm2_5": 142.0, "pm10": 218.0, "temperature": 32.0, "humidity": 49.0, "pressure": 1011.8},
            {"pm2_5": 158.0, "pm10": 240.0, "temperature": 33.2, "humidity": 47.0, "pressure": 1011.2},
            {"pm2_5": 148.0, "pm10": 225.0, "temperature": 32.8, "humidity": 51.0, "pressure": 1012.0},
            {"pm2_5": 165.0, "pm10": 255.0, "temperature": 34.0, "humidity": 48.0, "pressure": 1010.9},
            {"pm2_5": 175.0, "pm10": 270.0, "temperature": 35.1, "humidity": 46.0, "pressure": 1010.5},
            {"pm2_5": 160.0, "pm10": 245.0, "temperature": 34.4, "humidity": 49.0, "pressure": 1011.0},
        ]
    }
    res_forecast = client.post("/api/v1/forecast", json=forecast_payload)
    print(f"   Status: {res_forecast.status_code}")
    forecast_data = res_forecast.json()
    print(f"   Model Architecture: {forecast_data.get('model_architecture')}")
    print(f"   Target Node: {forecast_data.get('node_id')}")
    print(f"   Forecast Horizon: {forecast_data.get('forecast_horizon_days')} Days")
    print(f"   Projected Peak AQI: {forecast_data.get('projected_peak_aqi')}")
    print(f"   Projected Mean AQI: {forecast_data.get('projected_mean_aqi')}")
    print(f"   Spike Alerts Count: {forecast_data.get('projected_spikes_count')}")
    print(f"   Heat Island Days Count: {forecast_data.get('heat_island_days_count')}")
    print(f"   First 3 Forecast Days Sample:")
    for d in forecast_data.get('daily_forecast', [])[:3]:
        print(f"     - Day {d['day_offset']} ({d['date']}): {d['predicted_aqi']} AQI ({d['aqi_category']}) | Temp: {d['parameters']['temperature_celsius']}°C | Spike: {d['flags']['aqi_spike']} | Heat Island: {d['flags']['micro_climate_heat_island']}")
    print()
    assert res_forecast.status_code == 200, "Forecast endpoint failed"

    # 4. Bus Intersection Auto-Calibration
    print("4. [POST /api/v1/calibrate]")
    calibrate_payload = {
        "telemetry_samples": [
            {
                "node_id": "SN-MOB-001",
                "latitude": 28.63280,
                "longitude": 77.21950,
                "pm2_5": 146.4,
                "co2": 592.0,
                "timestamp": "2026-10-12T04:10:00Z"
            },
            {
                "node_id": "SN-MOB-004",
                "latitude": 28.63285,
                "longitude": 77.21954,
                "pm2_5": 138.8,
                "co2": 578.0,
                "timestamp": "2026-10-12T04:10:02Z"
            }
        ]
    }
    res_calibrate = client.post("/api/v1/calibrate", json=calibrate_payload)
    print(f"   Status: {res_calibrate.status_code}")
    calibrate_data = res_calibrate.json()
    print(f"   Job ID: {calibrate_data.get('job_id')}")
    print(f"   Message: {calibrate_data.get('message')}")
    print(f"   Results Summary: {calibrate_data.get('calibration_results', {}).get('updated_node_offsets')}\n")
    assert res_calibrate.status_code == 200, "Calibrate endpoint failed"

    print("=================================================================")
    print("[SUCCESS] All Cloud AI Microservice Endpoints Verified Successfully!")
    print("=================================================================")

if __name__ == "__main__":
    test_endpoints()
