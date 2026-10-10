from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import KrigingRequest, KrigingResponse
from app.services.kriging_service import (
    execute_street_kriging,
    get_default_delhi_streets
)
from app.db import fetch_recent_telemetry_points

router = APIRouter(prefix="/kriging", tags=["Kriging Spatial Interpolation"])

@router.post("", response_model=KrigingResponse)
async def perform_kriging(request: KrigingRequest):
    """
    Executes Ordinary Kriging geostatistical spatial interpolation.
    Fetches recent PostGIS telemetry points and computes interpolated pollutant
    concentrations and estimation variances along city street line geometries.
    """
    try:
        # 1. Fetch observation points (from request or query PostGIS)
        points = request.custom_points
        if not points:
            points = await fetch_recent_telemetry_points(
                city=request.city,
                parameter=request.parameter,
                time_window_minutes=request.time_window_minutes
            )

        if len(points) < 2:
            raise HTTPException(
                status_code=400,
                detail="Ordinary Kriging requires at least 2 distinct spatial telemetry points."
            )

        # 2. Identify target streets
        streets = request.streets or get_default_delhi_streets()

        # 3. Execute Kriging interpolation along street polylines
        geojson_result = execute_street_kriging(
            points=points,
            streets=streets,
            parameter=request.parameter,
            variogram_model=request.variogram_model or "spherical"
        )

        return KrigingResponse(
            status="success",
            city=request.city,
            parameter=request.parameter,
            points_sampled_count=len(points),
            streets_interpolated_count=len(geojson_result.get("features", [])),
            kriging_model=f"Ordinary Kriging ({request.variogram_model or 'spherical'} variogram)",
            geojson=geojson_result
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Kriging calculation failed: {str(e)}"
        )
