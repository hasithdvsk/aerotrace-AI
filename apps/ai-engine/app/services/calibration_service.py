import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    BusObservation,
    NodeCalibrationOffset,
    CalibrationRequest,
    CalibrationResponse
)

def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in meters between two geographic coordinates."""
    R = 6371000.0 # Earth radius in meters
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def generate_default_bus_trajectories() -> List[BusObservation]:
    """
    Generates synthetic mobile bus sensor trajectories with natural intersection encounters.
    Simulates Bus Fleet #42 and Bus Fleet #18 crossing at Connaught Place outer circle.
    """
    base_time = datetime.now(timezone.utc) - timedelta(hours=2)
    obs = []

    # Bus Route 42 (Moving eastward toward Barakhamba)
    route_42_coords = [
        (28.6310, 77.2150),
        (28.6315, 77.2167), # Intersection point (Connaught Place)
        (28.6320, 77.2185),
    ]

    # Bus Route 18 (Moving northward intersecting Route 42)
    route_18_coords = [
        (28.6295, 77.2165),
        (28.6316, 77.2168), # Intersection point (~15 meters from Bus 42)
        (28.6335, 77.2170),
    ]

    # Observations for Bus 42
    for idx, (lat, lon) in enumerate(route_42_coords):
        obs.append(BusObservation(
            node_code="SN-MOB-042",
            bus_route_id="ROUTE-42-DTC",
            timestamp=base_time + timedelta(seconds=idx * 20),
            latitude=lat,
            longitude=lon,
            pm2_5=74.2 if idx != 1 else 78.5,
            pm10=148.0,
            co2=450.0,
            temperature=28.2,
            humidity=56.0
        ))

    # Observations for Bus 18
    for idx, (lat, lon) in enumerate(route_18_coords):
        obs.append(BusObservation(
            node_code="SN-MOB-018",
            bus_route_id="ROUTE-18-DTC",
            timestamp=base_time + timedelta(seconds=idx * 20 + 5), # 5 second offset
            latitude=lat,
            longitude=lon,
            pm2_5=85.0 if idx != 1 else 89.2, # Uncalibrated sensor drifts +10.7 µg/m³ higher
            pm10=165.0,
            co2=472.0,
            temperature=28.3,
            humidity=55.8
        ))

    return obs

def execute_bus_calibration(request: CalibrationRequest) -> CalibrationResponse:
    """
    Identifies spatio-temporal co-locations where mobile buses intersect
    within (max_distance_meters, max_time_delta_seconds) and computes calibration offsets.
    """
    observations = request.custom_observations or generate_default_bus_trajectories()
    
    # Group observations by node_code
    nodes = list(set(o.node_code for o in observations))
    offsets: List[NodeCalibrationOffset] = []
    encounters_count = 0

    # Search for pairwise intersection encounters across different buses
    for i in range(len(observations)):
        for j in range(i + 1, len(observations)):
            obs_a = observations[i]
            obs_b = observations[j]

            if obs_a.node_code == obs_b.node_code:
                continue

            # Temporal condition: |t_A - t_B| <= threshold
            time_diff = abs((obs_a.timestamp - obs_b.timestamp).total_seconds())
            if time_diff > request.max_time_delta_seconds:
                continue

            # Spatial condition: Haversine distance <= threshold
            dist = haversine_meters(
                obs_a.latitude, obs_a.longitude,
                obs_b.latitude, obs_b.longitude
            )
            if dist > request.max_distance_meters:
                continue

            encounters_count += 1

            # Designate reference: lower node number or consensus
            # Target is obs_b, Reference is obs_a
            pm25_diff = obs_a.pm2_5 - obs_b.pm2_5
            pm10_diff = obs_a.pm10 - obs_b.pm10
            co2_diff = obs_a.co2 - obs_b.co2

            scale_factor = round(obs_a.pm2_5 / max(1.0, obs_b.pm2_5), 3)

            # Spatial confidence weight decays with distance and time gap
            dist_weight = max(0.2, 1.0 - (dist / request.max_distance_meters))
            time_weight = max(0.2, 1.0 - (time_diff / request.max_time_delta_seconds))
            confidence = round(dist_weight * time_weight, 3)

            mid_lat = round((obs_a.latitude + obs_b.latitude) / 2.0, 6)
            mid_lon = round((obs_a.longitude + obs_b.longitude) / 2.0, 6)

            offsets.append(NodeCalibrationOffset(
                target_node_code=obs_b.node_code,
                reference_node_code=obs_a.node_code,
                intersection_timestamp=obs_a.timestamp,
                distance_meters=round(dist, 2),
                intersection_coordinates=[mid_lon, mid_lat],
                raw_pm25_target=round(obs_b.pm2_5, 2),
                raw_pm25_reference=round(obs_a.pm2_5, 2),
                pm25_offset=round(pm25_diff, 2),
                pm10_offset=round(pm10_diff, 2),
                co2_offset=round(co2_diff, 2),
                gain_scale_factor=scale_factor,
                confidence_score=confidence
            ))

    # Build summary matrix
    summary: Dict[str, Any] = {}
    for off in offsets:
        if off.target_node_code not in summary:
            summary[off.target_node_code] = {
                "suggested_pm25_adjustment": off.pm25_offset,
                "suggested_gain": off.gain_scale_factor,
                "encounters_evaluated": 1,
                "last_calibrated_against": off.reference_node_code
            }
        else:
            summary[off.target_node_code]["encounters_evaluated"] += 1

    return CalibrationResponse(
        status="success",
        time_window_hours=request.time_window_hours,
        intersections_detected=encounters_count,
        calibrated_node_pairs=len(offsets),
        calibration_offsets=offsets,
        summary_matrix=summary
    )
