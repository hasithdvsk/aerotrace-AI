from fastapi import APIRouter, HTTPException
from app.models.schemas import CalibrationRequest, CalibrationResponse
from app.services.calibration_service import execute_bus_calibration
from app.db import fetch_bus_telemetry_history

router = APIRouter(prefix="/calibrate", tags=["Mobile Bus Auto-Calibration"])

@router.post("", response_model=CalibrationResponse)
async def auto_calibrate_buses(request: CalibrationRequest):
    """
    Identifies intersecting mobile bus coordinates at identical timestamps
    within spatial and temporal tolerance (e.g. 35m, 45s) and computes
    inter-sensor auto-calibration offsets and gain multipliers.
    """
    try:
        if not request.custom_observations:
            db_observations = await fetch_bus_telemetry_history(
                time_window_hours=request.time_window_hours
            )
            request.custom_observations = db_observations

        response = execute_bus_calibration(request)
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Bus auto-calibration failed: {str(e)}"
        )
