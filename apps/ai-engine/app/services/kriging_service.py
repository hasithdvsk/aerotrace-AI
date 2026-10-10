import math
import numpy as np
from typing import List, Dict, Any, Tuple
from app.models.schemas import TelemetryPoint, StreetInput, StreetLineFeature

# Standard Haversine distance in kilometers
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class OrdinaryKrigingInterpolator:
    """
    Mathematical Geostatistical Ordinary Kriging Interpolator.
    Solves BLUE (Best Linear Unbiased Estimator) system across 2D spatial points.
    """
    def __init__(
        self,
        points: List[TelemetryPoint],
        variogram_model: str = "spherical",
        nugget: float = 4.0,
        sill: float = 120.0,
        range_km: float = 6.5
    ):
        if len(points) < 2:
            raise ValueError("Kriging requires at least 2 spatial observation points.")
        
        self.points = points
        self.n = len(points)
        self.variogram_model = variogram_model.lower()
        self.nugget = nugget
        self.sill = sill
        self.range_km = range_km

        # Observation coordinates and values
        self.lats = np.array([p.latitude for p in points])
        self.lons = np.array([p.longitude for p in points])
        self.values = np.array([p.value for p in points])

        # Precompute and invert (n+1)x(n+1) Kriging matrix
        self.k_inv = self._build_kriging_matrix_inv()

    def _semivariogram(self, h: float) -> float:
        """Computes semivariance γ(h) for spatial lag distance h (km)."""
        if h <= 1e-6:
            return 0.0

        if self.variogram_model == "spherical":
            if h <= self.range_km:
                return self.nugget + self.sill * (1.5 * (h / self.range_km) - 0.5 * (h / self.range_km) ** 3)
            else:
                return self.nugget + self.sill

        elif self.variogram_model == "exponential":
            return self.nugget + self.sill * (1.0 - math.exp(-3.0 * h / self.range_km))

        elif self.variogram_model == "gaussian":
            return self.nugget + self.sill * (1.0 - math.exp(-3.0 * (h / self.range_km) ** 2))

        else: # Default spherical
            if h <= self.range_km:
                return self.nugget + self.sill * (1.5 * (h / self.range_km) - 0.5 * (h / self.range_km) ** 3)
            return self.nugget + self.sill

    def _build_kriging_matrix_inv(self) -> np.ndarray:
        K = np.zeros((self.n + 1, self.n + 1))
        
        # Pairwise semivariances
        for i in range(self.n):
            for j in range(self.n):
                if i != j:
                    dist = haversine_km(self.lats[i], self.lons[i], self.lats[j], self.lons[j])
                    K[i, j] = self._semivariogram(dist)
                else:
                    K[i, j] = 0.0

        # Unbiasedness constraints
        K[0:self.n, self.n] = 1.0
        K[self.n, 0:self.n] = 1.0
        K[self.n, self.n] = 0.0

        # Regularize diagonal slightly to ensure positive definiteness
        diag_idx = np.diag_indices(self.n)
        K[diag_idx] += 1e-4

        # Inverse of Kriging system
        try:
            return np.linalg.inv(K)
        except np.linalg.LinAlgError:
            return np.linalg.pinv(K)

    def predict(self, target_lat: float, target_lon: float) -> Tuple[float, float, float]:
        """
        Interpolates value at (target_lat, target_lon).
        Returns: (predicted_value, kriging_variance, confidence_score)
        """
        k = np.zeros(self.n + 1)
        for i in range(self.n):
            d = haversine_km(self.lats[i], self.lons[i], target_lat, target_lon)
            k[i] = self._semivariogram(d)
        k[self.n] = 1.0

        # Solve for weights: w = K_inv * k
        w = np.dot(self.k_inv, k)
        weights = w[0:self.n]
        lagrange_mu = w[self.n]

        # Best Linear Unbiased Prediction
        estimated_val = float(np.sum(weights * self.values))

        # Kriging Estimation Variance: σ_k^2 = sum(w_i * γ_i) + μ
        variance = float(np.sum(weights * k[0:self.n]) + lagrange_mu)
        variance = max(0.1, variance)

        # Confidence metric (inversely proportional to standard error vs total sill)
        std_err = math.sqrt(variance)
        confidence = max(0.15, min(0.99, 1.0 - (std_err / (self.nugget + self.sill + 1e-5))))

        return estimated_val, variance, confidence


def get_default_delhi_streets() -> List[StreetInput]:
    """Default representative city street polyline geometries for demonstration."""
    return [
        StreetInput(
            street_id="st-01",
            street_name="Barakhamba Road & Outer Circle Corridor",
            coordinates=[
                [77.2167, 28.6315],
                [77.2201, 28.6328],
                [77.2245, 28.6341],
                [77.2289, 28.6356],
            ]
        ),
        StreetInput(
            street_id="st-02",
            street_name="Vikas Marg Arterial Highway",
            coordinates=[
                [77.2600, 28.6350],
                [77.2800, 28.6410],
                [77.3000, 28.6440],
                [77.3160, 28.6469],
            ]
        ),
        StreetInput(
            street_id="st-03",
            street_name="Mahatma Gandhi Ring Road (South)",
            coordinates=[
                [77.2100, 28.5700],
                [77.2300, 28.5720],
                [77.2500, 28.5680],
                [77.2732, 28.5355],
            ]
        ),
        StreetInput(
            street_id="st-04",
            street_name="Lodhi Road Heritage Green Corridor",
            coordinates=[
                [77.2050, 28.5910],
                [77.2150, 28.5925],
                [77.2280, 28.5940],
                [77.2400, 28.5960],
            ]
        ),
        StreetInput(
            street_id="st-05",
            street_name="Captain Gaur Marg Commercial Transit",
            coordinates=[
                [77.2550, 28.5450],
                [77.2620, 28.5400],
                [77.2700, 28.5380],
                [77.2750, 28.5330],
            ]
        ),
    ]


def get_default_postgis_telemetry_points() -> List[TelemetryPoint]:
    """Fallback observation points corresponding to PostGIS database seed records."""
    return [
        TelemetryPoint(node_code="SN-DEL-001", latitude=28.6315, longitude=77.2167, value=158.0),
        TelemetryPoint(node_code="SN-DEL-002", latitude=28.6469, longitude=77.3160, value=215.0),
        TelemetryPoint(node_code="SN-DEL-003", latitude=28.5355, longitude=77.2732, value=179.0),
        TelemetryPoint(node_code="SN-MOB-009", latitude=28.5822, longitude=77.2341, value=164.0),
        TelemetryPoint(node_code="SN-DEL-004", latitude=28.5933, longitude=77.2197, value=78.0),
    ]


def execute_street_kriging(
    points: List[TelemetryPoint],
    streets: List[StreetInput],
    parameter: str = "aqi",
    variogram_model: str = "spherical"
) -> Dict[str, Any]:
    """
    Executes Ordinary Kriging along street polyline geometries.
    Outputs standard GeoJSON FeatureCollection with line geometries.
    """
    kriging = OrdinaryKrigingInterpolator(points=points, variogram_model=variogram_model)
    features = []

    for st in streets:
        coords = st.coordinates
        if len(coords) < 2:
            continue

        # Sample points along the street segment line
        sample_lats = []
        sample_lons = []
        for i in range(len(coords) - 1):
            lon_a, lat_a = coords[i]
            lon_b, lat_b = coords[i + 1]
            # Sample midpoint and endpoints
            sample_lats.extend([lat_a, (lat_a + lat_b) / 2.0, lat_b])
            sample_lons.extend([lon_a, (lon_a + lon_b) / 2.0, lon_b])

        # Evaluate Kriging BLUE estimates at sampled points along the line
        estimates = []
        variances = []
        confidences = []
        for lat, lon in zip(sample_lats, sample_lons):
            est, var, conf = kriging.predict(lat, lon)
            estimates.append(est)
            variances.append(var)
            confidences.append(conf)

        avg_val = float(np.mean(estimates))
        avg_var = float(np.mean(variances))
        avg_conf = float(np.mean(confidences))

        if parameter.lower() in ["pm2_5", "pm25"]:
            interpolated_pm25 = max(5.0, round(avg_val, 1))
            interpolated_aqi = int(round(interpolated_pm25 * 2.3))
        else:
            interpolated_aqi = max(10, min(500, int(round(avg_val))))
            interpolated_pm25 = round(interpolated_aqi / 2.3, 1)

        # Category
        if interpolated_aqi <= 50:
            category = "Good"
        elif interpolated_aqi <= 100:
            category = "Moderate"
        elif interpolated_aqi <= 150:
            category = "Unhealthy for Sensitive Groups"
        elif interpolated_aqi <= 200:
            category = "Unhealthy"
        elif interpolated_aqi <= 300:
            category = "Very Unhealthy"
        else:
            category = "Hazardous"

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {
                "street_id": st.street_id,
                "street_name": st.street_name,
                "interpolated_aqi": interpolated_aqi,
                "interpolated_pm25": interpolated_pm25,
                "variance": round(avg_var, 3),
                "confidence_score": round(avg_conf, 3),
                "aqi_category": category,
                "dominant_pollutant": "PM2.5"
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }
