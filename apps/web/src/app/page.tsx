"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Radio,
  Satellite,
  Layers,
  Database,
  MapPin,
  Cpu,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  Code2,
  Terminal,
  Zap,
  BarChart3,
  Flame,
  CheckCircle2,
  Navigation2,
} from "lucide-react";

const CleanestRouteMap = dynamic(
  () => import("../components/CleanestRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs animate-pulse">
        Initializing Mapbox GL JS Spatial Canvas & PostGIS Street Grid...
      </div>
    ),
  }
);

// Mock data representing the 4 database models
const INITIAL_SENSOR_NODES = [
  {
    id: "a101b202-c303-4d04-e505-f606a707b808",
    nodeCode: "SN-DEL-001",
    name: "Connaught Place Central Station",
    status: "ACTIVE",
    nodeType: "STATIONARY",
    latitude: 28.6315,
    longitude: 77.2167,
    altitudeMeters: 216.0,
    hardwareVersion: "v2.4-solar",
    firmwareVersion: "1.8.2",
    batteryLevel: 94.5,
    installedAt: "2026-01-15T00:00:00Z",
    lastSeenAt: "Just now",
  },
  {
    id: "b202c303-d404-e505-f606-a707b808c909",
    nodeCode: "SN-DEL-002",
    name: "Anand Vihar Transit Hub",
    status: "ACTIVE",
    nodeType: "STATIONARY",
    latitude: 28.6469,
    longitude: 77.3160,
    altitudeMeters: 208.5,
    hardwareVersion: "v2.4-grid",
    firmwareVersion: "1.8.2",
    batteryLevel: 100.0,
    installedAt: "2026-01-20T00:00:00Z",
    lastSeenAt: "Just now",
  },
  {
    id: "c303d404-e505-f606-a707-b808c909d010",
    nodeCode: "SN-DEL-003",
    name: "Okhla Industrial Phase II",
    status: "ACTIVE",
    nodeType: "STATIONARY",
    latitude: 28.5355,
    longitude: 77.2732,
    altitudeMeters: 221.0,
    hardwareVersion: "v2.5-grid",
    firmwareVersion: "1.8.2",
    batteryLevel: 98.2,
    installedAt: "2026-02-01T00:00:00Z",
    lastSeenAt: "2 mins ago",
  },
  {
    id: "d404e505-f606-a707-b808-c909d010e111",
    nodeCode: "SN-MOB-009",
    name: "EV Transit Bus Fleet #42",
    status: "ACTIVE",
    nodeType: "MOBILE",
    latitude: 28.5822,
    longitude: 77.2341,
    altitudeMeters: 214.0,
    hardwareVersion: "v3.0-mobile-gps",
    firmwareVersion: "2.1.0",
    batteryLevel: 88.0,
    installedAt: "2026-03-10T00:00:00Z",
    lastSeenAt: "10s ago",
  },
  {
    id: "e505f606-a707-b808-c909-d010e111f222",
    nodeCode: "SN-DEL-004",
    name: "Lodhi Garden Ecological Node",
    status: "CALIBRATING",
    nodeType: "CALIBRATION_REF",
    latitude: 28.5933,
    longitude: 77.2197,
    altitudeMeters: 218.0,
    hardwareVersion: "v2.8-ref-grade",
    firmwareVersion: "1.9.0",
    batteryLevel: 99.1,
    installedAt: "2026-03-12T00:00:00Z",
    lastSeenAt: "15 mins ago",
  },
];

const INITIAL_TELEMETRY = [
  {
    id: "t1-9981",
    nodeCode: "SN-DEL-001",
    timestamp: "13:20:15",
    pm25: 68.4,
    pm10: 142.1,
    no2: 45.2,
    so2: 12.8,
    co: 1.1,
    o3: 28.3,
    temp: 27.4,
    humidity: 58.0,
    aqi: 158,
    status: "Unhealthy (Sens.)",
  },
  {
    id: "t2-9982",
    nodeCode: "SN-DEL-002",
    timestamp: "13:20:12",
    pm25: 112.5,
    pm10: 235.8,
    no2: 78.4,
    so2: 24.2,
    co: 2.4,
    o3: 31.0,
    temp: 29.0,
    humidity: 52.0,
    aqi: 215,
    status: "Very Unhealthy",
  },
  {
    id: "t3-9983",
    nodeCode: "SN-DEL-003",
    timestamp: "13:19:55",
    pm25: 89.1,
    pm10: 184.2,
    no2: 56.7,
    so2: 18.0,
    co: 1.7,
    o3: 24.1,
    temp: 28.5,
    humidity: 55.4,
    aqi: 179,
    status: "Unhealthy",
  },
  {
    id: "t4-9984",
    nodeCode: "SN-MOB-009",
    timestamp: "13:19:40",
    pm25: 74.0,
    pm10: 150.3,
    no2: 51.2,
    so2: 13.5,
    co: 1.3,
    o3: 27.9,
    temp: 28.2,
    humidity: 56.0,
    aqi: 164,
    status: "Unhealthy (Sens.)",
  },
];

const INITIAL_SATELLITE_DATA = [
  {
    id: "sat-001",
    satelliteSource: "SENTINEL-5P (TROPOMI)",
    granuleId: "S5P_RPRO_L2__AER_AI_20261010T080000",
    timestamp: "2026-10-10 08:30 UTC",
    aod: 0.58,
    no2Column: "1.42 x 10¹⁵ mol/cm²",
    pm25Est: 78.2,
    cloudFraction: "12%",
    resolution: "3.5 x 5.5 km",
    footprint: "SRID 4326 POLYGON((76.8 28.2, 77.5 28.2, 77.5 28.9, 76.8 28.9))",
  },
  {
    id: "sat-002",
    satelliteSource: "MODIS-TERRA (AOD)",
    granuleId: "MOD04_L2.A2026283.0545.061",
    timestamp: "2026-10-10 05:45 UTC",
    aod: 0.62,
    no2Column: "N/A",
    pm25Est: 84.5,
    cloudFraction: "8%",
    resolution: "1.0 x 1.0 km",
    footprint: "SRID 4326 POLYGON((76.5 28.0, 77.6 28.0, 77.6 29.1, 76.5 29.1))",
  },
  {
    id: "sat-003",
    satelliteSource: "INSAT-3DR (Imager)",
    granuleId: "3DR_IMG_20261010_0715_L2B_AOD",
    timestamp: "2026-10-10 07:15 UTC",
    aod: 0.55,
    no2Column: "N/A",
    pm25Est: 72.0,
    cloudFraction: "14%",
    resolution: "4.0 x 4.0 km",
    footprint: "SRID 4326 POLYGON((76.0 27.5, 78.0 27.5, 78.0 29.5, 76.0 29.5))",
  },
];

const INITIAL_STREET_GRIDS = [
  {
    id: "g-01",
    gridCode: "H3-882681a339fffff",
    streetName: "Barakhamba Road & Inner Circle",
    neighborhood: "Connaught Place",
    currentAqi: 158,
    dominantPollutant: "PM2.5",
    pm25: 68.4,
    pm10: 142.1,
    no2: 45.2,
    confidence: "94%",
    category: "Unhealthy for Sensitive",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    bounds: "POLYGON((77.215 28.630, 77.218 28.630, 77.220 28.633, ...))",
  },
  {
    id: "g-02",
    gridCode: "H3-882681a33bfffff",
    streetName: "Vikas Marg Bus Corridor",
    neighborhood: "Anand Vihar",
    currentAqi: 215,
    dominantPollutant: "PM2.5",
    pm25: 112.5,
    pm10: 235.8,
    no2: 78.4,
    confidence: "91%",
    category: "Very Unhealthy",
    categoryColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    bounds: "POLYGON((77.314 28.645, 77.318 28.645, 77.320 28.649, ...))",
  },
  {
    id: "g-03",
    gridCode: "H3-882681a335fffff",
    streetName: "Captain Gaur Marg",
    neighborhood: "Okhla Phase II",
    currentAqi: 179,
    dominantPollutant: "PM10",
    pm25: 89.1,
    pm10: 184.2,
    no2: 56.7,
    confidence: "88%",
    category: "Unhealthy",
    categoryColor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    bounds: "POLYGON((77.271 28.533, 77.275 28.533, 77.276 28.538, ...))",
  },
  {
    id: "g-04",
    gridCode: "H3-882681a337fffff",
    streetName: "Lodhi Road Environmental Green Zone",
    neighborhood: "Lodhi Colony",
    currentAqi: 78,
    dominantPollutant: "O3",
    pm25: 22.4,
    pm10: 51.0,
    no2: 24.1,
    confidence: "96%",
    category: "Moderate",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    bounds: "POLYGON((77.218 28.591, 77.222 28.591, 77.224 28.595, ...))",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "routes" | "nodes" | "telemetry" | "satellite" | "grid" | "schema">("overview");
  const [selectedGrid, setSelectedGrid] = useState(INITIAL_STREET_GRIDS[0]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wind className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  AetherGrid
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono">
                  v1.0-monorepo
                </span>
              </div>
              <p className="text-xs text-slate-400">PostGIS × TimescaleDB Hyperlocal Scaffolding</p>
            </div>
          </div>

          {/* Architecture Badges */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Next.js 16 (apps/web)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Prisma ORM (@repo/db)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-purple-300">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>PostGIS + TimescaleDB</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-cyan-950/20 p-6 md:p-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Production Database Schema & Micro-Frontend Scaffolding</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Hyperlocal Urban Air Quality & Spatial Fusion Engine
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Integrated monorepo architecture uniting ground-level IoT sensor hypertable telemetry, Sentinel-5P satellite tropospheric data, and PostGIS street grid polygon interpolation.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab("routes")}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-2 transition shadow-lg shadow-emerald-600/30"
              >
                <Navigation2 className="h-4 w-4" />
                <span>Cleanest Route Navigation</span>
              </button>
              <button
                onClick={() => setActiveTab("schema")}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 transition border border-slate-700"
              >
                <Code2 className="h-4 w-4" />
                <span>View Schema & SQL</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 Core Scaffolding Models Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("nodes")}
            className="cursor-pointer group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Table: sensor_nodes</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
                <Radio className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">5 Stations</div>
            <div className="text-xs text-slate-400 flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>PostGIS Point(x, y, 4326)</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("telemetry")}
            className="cursor-pointer group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Table: iot_telemetry</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">TimescaleDB</div>
            <div className="text-xs text-slate-400 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Hypertable partitioned on timestamp</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("satellite")}
            className="cursor-pointer group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Table: satellite_macro_data</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
                <Satellite className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Sentinel-5P / MODIS</div>
            <div className="text-xs text-slate-400 flex items-center space-x-1">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>AOD & Tropospheric NO2 Column</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("grid")}
            className="cursor-pointer group p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Table: street_aqi_grid</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">4 H3 Grid Cells</div>
            <div className="text-xs text-slate-400 flex items-center space-x-1">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>PostGIS Polygon(4326) & Centroid</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "routes"
                ? "bg-emerald-950/70 text-emerald-400 font-semibold border-b-2 border-emerald-400"
                : "text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30"
            }`}
          >
            <Navigation2 className="h-4 w-4 text-emerald-400" />
            <span>Cleanest Route Navigation (Mapbox GL JS)</span>
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "overview"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Interactive Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("nodes")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "nodes"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Sensor Nodes ({INITIAL_SENSOR_NODES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "telemetry"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>IoT Telemetry Hypertable</span>
          </button>
          <button
            onClick={() => setActiveTab("satellite")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "satellite"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Satellite className="h-4 w-4" />
            <span>Satellite Macro Data</span>
          </button>
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "grid"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Street AQI Grid (PostGIS)</span>
          </button>
          <button
            onClick={() => setActiveTab("schema")}
            className={`px-4 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "schema"
                ? "bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Prisma Schema & Migration SQL</span>
          </button>
        </div>

        {/* Tab 0: CLEANEST ROUTE NAVIGATION (MAPBOX GL JS) */}
        {activeTab === "routes" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Navigation2 className="h-5 w-5 text-emerald-400" />
                  <span>Cleanest Route Navigation (Mapbox GL JS + PostGIS)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Evaluates Mapbox route alternatives against the PostGIS <code className="text-emerald-400 font-mono">street_aqi_grid</code> table and highlights the path with the lowest cumulative exposure score in green.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono flex items-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Lowest Exposure Highlight Active</span>
                </span>
              </div>
            </div>

            <CleanestRouteMap />
          </div>
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Grid Map Representation */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        <span>Hyperlocal Street Air Quality Index (PostGIS Grid Fusion)</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Select a street grid cell to view sensor-satellite calibrated pollution metrics.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                      EPSG:4326 WGS84
                    </span>
                  </div>

                  {/* Simulated Spatial Grid Hex/Block Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {INITIAL_STREET_GRIDS.map((grid) => {
                      const isSelected = selectedGrid.id === grid.id;
                      return (
                        <div
                          key={grid.id}
                          onClick={() => setSelectedGrid(grid)}
                          className={`cursor-pointer p-4 rounded-xl border transition ${
                            isSelected
                              ? "bg-slate-800/80 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-950"
                              : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-xs font-mono text-slate-400">{grid.gridCode}</div>
                              <div className="font-semibold text-sm text-white">{grid.streetName}</div>
                              <div className="text-xs text-slate-400">{grid.neighborhood}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-white">{grid.currentAqi}</span>
                              <div className="text-[10px] uppercase tracking-wider text-slate-400">AQI</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${grid.categoryColor}`}>
                              {grid.category}
                            </span>
                            <span className="text-slate-400 font-mono">Confidence: {grid.confidence}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Grid Cell PostGIS Inspector */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      <span>PostGIS Spatial Geometry & Data Breakdown: {selectedGrid.streetName}</span>
                    </span>
                    <span className="text-xs text-slate-400">Dominant Pollutant: <strong className="text-white">{selectedGrid.dominantPollutant}</strong></span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">PM2.5 (Fine Particulate)</div>
                      <div className="text-lg font-bold text-cyan-300">{selectedGrid.pm25} <span className="text-xs text-slate-500 font-normal">µg/m³</span></div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">PM10 (Coarse Particulate)</div>
                      <div className="text-lg font-bold text-amber-300">{selectedGrid.pm10} <span className="text-xs text-slate-500 font-normal">µg/m³</span></div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">NO₂ (Nitrogen Dioxide)</div>
                      <div className="text-lg font-bold text-rose-300">{selectedGrid.no2} <span className="text-xs text-slate-500 font-normal">ppb</span></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/60 font-mono text-xs text-slate-400">
                    <div className="text-[11px] text-slate-500 mb-1">Spatial Polygon (PostGIS ST_GeomFromText):</div>
                    <div className="text-cyan-400/90 truncate">{selectedGrid.bounds}</div>
                  </div>
                </div>
              </div>

              {/* Right Col: Monorepo Setup & Architecture Details */}
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>Scaffold Architecture Summary</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="font-semibold text-cyan-400">apps/web (Next.js 16)</div>
                      <p className="text-slate-400">App Router with React 19, TypeScript, and Tailwind CSS configured for high-performance dashboards and edge-compatible API routes.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="font-semibold text-emerald-400">packages/db (Prisma ORM)</div>
                      <p className="text-slate-400">Configured with preview feature <code className="text-emerald-300 font-mono">postgresqlExtensions</code> supporting PostGIS geometries and TimescaleDB hypertables.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="font-semibold text-purple-400">PostGIS + TimescaleDB Extensions</div>
                      <p className="text-slate-400">Includes PostGIS GiST spatial indexing, ST_Centroid trigger calculations, and automatic TimescaleDB hypertable partitioning on <code className="text-purple-300 font-mono">iot_telemetry(timestamp)</code>.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Migration Status */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    <span>Initial Migrations Generated</span>
                  </h3>
                  <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
                    <div className="text-emerald-400">packages/db/prisma/migrations/0_init/</div>
                    <div className="text-slate-400 pl-2">└── migration.sql (All 4 tables, triggers, GiST & Hypertable)</div>
                    <div className="text-slate-400 pl-2">└── migration_lock.toml (PostgreSQL provider lock)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SENSOR NODES */}
        {activeTab === "nodes" && (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  <span>Table: sensor_nodes (Hardware Stations)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ground-truth IoT stations with PostGIS Point geometries (SRID 4326) and battery metrics.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
                5 Active Nodes Deployed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-3">Node Code</th>
                    <th className="py-3 px-3">Station Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Coordinates (PostGIS Point)</th>
                    <th className="py-3 px-3">Firmware</th>
                    <th className="py-3 px-3">Battery</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {INITIAL_SENSOR_NODES.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono text-cyan-300 font-semibold">{node.nodeCode}</td>
                      <td className="py-3 px-3 font-medium text-white">{node.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{node.nodeType}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {node.latitude.toFixed(4)}°N, {node.longitude.toFixed(4)}°E ({node.altitudeMeters}m)
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{node.firmwareVersion}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={node.batteryLevel > 90 ? "text-emerald-400" : "text-amber-400"}>
                          {node.batteryLevel}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
                            node.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {node.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: IOT TELEMETRY */}
        {activeTab === "telemetry" && (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Table: iot_telemetry (TimescaleDB Hypertable)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  High-frequency time-series measurements partitioned by timestamp for high write-rate and compression.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                  SELECT create_hypertable('iot_telemetry', 'timestamp')
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Node Code</th>
                    <th className="py-3 px-3">PM2.5 (µg/m³)</th>
                    <th className="py-3 px-3">PM10 (µg/m³)</th>
                    <th className="py-3 px-3">NO₂ (ppb)</th>
                    <th className="py-3 px-3">SO₂ (ppb)</th>
                    <th className="py-3 px-3">CO (ppm)</th>
                    <th className="py-3 px-3">O₃ (ppb)</th>
                    <th className="py-3 px-3">Temp / RH</th>
                    <th className="py-3 px-3">AQI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {INITIAL_TELEMETRY.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-slate-400">{item.timestamp}</td>
                      <td className="py-3 px-3 font-semibold text-cyan-300">{item.nodeCode}</td>
                      <td className="py-3 px-3 text-white font-bold">{item.pm25}</td>
                      <td className="py-3 px-3 text-slate-300">{item.pm10}</td>
                      <td className="py-3 px-3 text-slate-300">{item.no2}</td>
                      <td className="py-3 px-3 text-slate-300">{item.so2}</td>
                      <td className="py-3 px-3 text-slate-300">{item.co}</td>
                      <td className="py-3 px-3 text-slate-300">{item.o3}</td>
                      <td className="py-3 px-3 text-slate-400">{item.temp}°C / {item.humidity}%</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-amber-400">{item.aqi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: SATELLITE MACRO DATA */}
        {activeTab === "satellite" && (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Satellite className="h-4 w-4 text-indigo-400" />
                  <span>Table: satellite_macro_data (Tropospheric Observations)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Regional atmospheric optical depth and gas column densities fused into street-level estimates.
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800">
                Sentinel-5P TROPOMI & MODIS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INITIAL_SATELLITE_DATA.map((sat) => (
                <div key={sat.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{sat.satelliteSource}</span>
                      <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{sat.granuleId}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{sat.timestamp}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aerosol Optical Depth (AOD):</span>
                      <strong className="text-cyan-300 font-mono">{sat.aod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tropospheric NO₂ Column:</span>
                      <span className="text-slate-200 font-mono">{sat.no2Column}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Calibrated PM2.5 Estimate:</span>
                      <strong className="text-white font-mono">{sat.pm25Est} µg/m³</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cloud Fraction:</span>
                      <span className="text-slate-300 font-mono">{sat.cloudFraction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spatial Resolution:</span>
                      <span className="text-slate-300 font-mono">{sat.resolution}</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 bg-slate-900 p-2 rounded truncate">
                    {sat.footprint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: STREET AQI GRID */}
        {activeTab === "grid" && (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>Table: street_aqi_grid (H3 Hexagonal Urban Grid)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Fused spatial cells storing PostGIS Polygons, Centroids, and calculated AQI indices.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INITIAL_STREET_GRIDS.map((g) => (
                <div key={g.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-amber-400">{g.gridCode}</span>
                      <h4 className="text-base font-bold text-white">{g.streetName}</h4>
                      <p className="text-xs text-slate-400">{g.neighborhood}, New Delhi</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white">{g.currentAqi}</span>
                      <div className="text-[10px] text-slate-400 uppercase">AQI</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${g.categoryColor}`}>
                      {g.category}
                    </span>
                    <span className="text-slate-400 font-mono">Dominant: {g.dominantPollutant}</span>
                    <span className="text-slate-400 font-mono">Confidence: {g.confidence}</span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded font-mono text-[11px] text-slate-400 break-all">
                    <div className="text-[10px] text-slate-500">PostGIS ST_Centroid trigger & GiST Index:</div>
                    {g.bounds}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: SCHEMA & SQL MIGRATION EXPLORER */}
        {activeTab === "schema" && (
          <div className="space-y-6">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>Prisma Schema (`packages/db/prisma/schema.prisma`)</span>
                </h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                  PostGIS & TimescaleDB Enabled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto custom-scrollbar">
                <pre>{`datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, timescaledb]
}

model SensorNode {
  id              String         @id @default(uuid()) @db.Uuid
  nodeCode        String         @unique @map("node_code") @db.VarChar(64)
  name            String         @db.VarChar(128)
  description     String?        @db.Text
  status          NodeStatus     @default(ACTIVE)
  nodeType        NodeType       @default(STATIONARY) @map("node_type")
  latitude        Decimal        @db.Decimal(10, 8)
  longitude       Decimal        @db.Decimal(11, 8)
  altitudeMeters  Float?         @map("altitude_meters")
  location        Unsupported("geometry(Point, 4326)")?
  telemetry       IotTelemetry[]
  @@map("sensor_nodes")
}

model IotTelemetry {
  id              String      @default(uuid()) @db.Uuid
  timestamp       DateTime    @db.Timestamptz(6)
  nodeId          String      @map("node_id") @db.Uuid
  node            SensorNode  @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  pm25            Float?      @map("pm2_5")
  pm10            Float?      @map("pm10")
  no2             Float?      @map("no2")
  temperature     Float?      @map("temperature")
  humidity        Float?      @map("humidity")
  @@id([timestamp, id]) // TimescaleDB hypertable partition primary key
  @@map("iot_telemetry")
}

model SatelliteMacroData {
  id              String      @id @default(uuid()) @db.Uuid
  satelliteSource String      @map("satellite_source") @db.VarChar(64)
  granuleId       String?     @map("granule_id") @db.VarChar(128)
  timestamp       DateTime    @db.Timestamptz(6)
  coverageArea    Unsupported("geometry(Polygon, 4326)")? @map("coverage_area")
  aod             Float?
  no2ColumnDensity Float?     @map("no2_column_density")
  @@map("satellite_macro_data")
}

model StreetAqiGrid {
  id              String      @id @default(uuid()) @db.Uuid
  gridCode        String      @unique @map("grid_code") @db.VarChar(64)
  streetName      String?     @map("street_name") @db.VarChar(255)
  geometry        Unsupported("geometry(Polygon, 4326)") @map("geometry")
  centroid        Unsupported("geometry(Point, 4326)")? @map("centroid")
  currentAqi      Int         @map("current_aqi")
  dominantPollutant String?   @map("dominant_pollutant") @db.VarChar(16)
  @@map("street_aqi_grid")
}`}</pre>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>Initial Migration SQL (`packages/db/prisma/migrations/0_init/migration.sql`)</span>
                </h2>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                  Ready for Deploy
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto custom-scrollbar">
                <pre>{`-- PostGIS Extension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- TimescaleDB Extension
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB extension load deferred: %', SQLERRM;
END $$;

-- PostGIS GiST Spatial Indices
CREATE INDEX "sensor_nodes_location_gist_idx" ON "sensor_nodes" USING GIST ("location");
CREATE INDEX "satellite_macro_data_coverage_area_gist_idx" ON "satellite_macro_data" USING GIST ("coverage_area");
CREATE INDEX "street_aqi_grid_geometry_gist_idx" ON "street_aqi_grid" USING GIST ("geometry");
CREATE INDEX "street_aqi_grid_centroid_gist_idx" ON "street_aqi_grid" USING GIST ("centroid");

-- Convert iot_telemetry to TimescaleDB Hypertable
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('iot_telemetry', 'timestamp', if_not_exists => TRUE);
    END IF;
END $$;`}</pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-semibold text-slate-300">AetherGrid Scaffolding</span> — Next.js App Router (apps/web) + Prisma ORM (packages/db)
          </div>
          <div className="font-mono text-slate-400">
            PostgreSQL 16+ • PostGIS 3.4+ • TimescaleDB 2.14+
          </div>
        </div>
      </footer>
    </div>
  );
}
