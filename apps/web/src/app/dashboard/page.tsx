"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LivePulseBadge from "@/components/animations/LivePulseBadge";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import {
  ShieldCheck,
  AlertTriangle,
  Radio,
  Satellite,
  Layers,
  Flame,
  Wind,
  Activity,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Bus,
  Sliders,
  RefreshCw,
  Download,
  FileText,
  Send,
  Bell,
  Filter,
  Award,
  Globe,
  ChevronRight,
  BarChart3,
  Navigation2,
  Zap,
  AlertCircle,
  Building2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

// --- Types & Interfaces ---

export interface BusMeshNode {
  id: string;
  code: string;
  route: string;
  status: "ONLINE" | "MESH_RELAY" | "SIGNAL_DEGRADED";
  lat: number;
  lon: number;
  speedKmh: number;
  pm25: number;
  pm10: number;
  co2: number;
  temperature: number;
  humidity: number;
  batteryPct: number;
  loraRssi: number;
  lastPing: string;
}

export interface EmissionHotspot {
  id: string;
  title: string;
  sector: string;
  pollutant: "CH4" | "PM2.5" | "CO2" | "NO2";
  value: string;
  baselineExceedance: string;
  severity: "CRITICAL" | "HIGH" | "ELEVATED" | "RESOLVED";
  detectedVia: string;
  timestamp: string;
  lat: number;
  lon: number;
  status: "ACTIVE" | "DISPATCHED" | "NOTICE_ISSUED" | "RESOLVED";
  assignedAction?: string;
}

export interface SentinelRasterTile {
  id: string;
  gasType: "CH4" | "CO2";
  sectorName: string;
  centerLat: number;
  centerLon: number;
  concentrationPpbOrPpm: number;
  unit: string;
  anomalyScore: number; // 0-100
  orbitNumber: number;
  cloudFraction: number;
}

// --- Mock Data ---

const INITIAL_BUS_MESH: BusMeshNode[] = [
  {
    id: "bus-01",
    code: "SN-MOB-001",
    route: "Ring Road Express (CP to Anand Vihar)",
    status: "ONLINE",
    lat: 28.6360,
    lon: 77.2410,
    speedKmh: 34.2,
    pm25: 142.5,
    pm10: 218.0,
    co2: 580,
    temperature: 31.4,
    humidity: 52,
    batteryPct: 91,
    loraRssi: -72,
    lastPing: "12s ago",
  },
  {
    id: "bus-02",
    code: "SN-MOB-002",
    route: "Outer Ring Corridor (Okhla - Nehru Place)",
    status: "ONLINE",
    lat: 28.5480,
    lon: 77.2620,
    speedKmh: 28.5,
    pm25: 284.1,
    pm10: 382.4,
    co2: 740,
    temperature: 33.1,
    humidity: 47,
    batteryPct: 86,
    loraRssi: -81,
    lastPing: "8s ago",
  },
  {
    id: "bus-03",
    code: "SN-MOB-003",
    route: "East Delhi Transit (Ghazipur - Preet Vihar)",
    status: "MESH_RELAY",
    lat: 28.6250,
    lon: 77.3240,
    speedKmh: 41.0,
    pm25: 312.8,
    pm10: 440.0,
    co2: 810,
    temperature: 32.8,
    humidity: 49,
    batteryPct: 78,
    loraRssi: -89,
    lastPing: "24s ago",
  },
  {
    id: "bus-04",
    code: "SN-MOB-004",
    route: "Central Eco-Transit (Lodhi - India Gate)",
    status: "ONLINE",
    lat: 28.6010,
    lon: 77.2240,
    speedKmh: 22.0,
    pm25: 58.4,
    pm10: 94.0,
    co2: 442,
    temperature: 29.8,
    humidity: 58,
    batteryPct: 98,
    loraRssi: -65,
    lastPing: "4s ago",
  },
  {
    id: "bus-05",
    code: "SN-MOB-005",
    route: "North Corridor (Kashmere Gate - Model Town)",
    status: "ONLINE",
    lat: 28.6720,
    lon: 77.2180,
    speedKmh: 31.8,
    pm25: 198.3,
    pm10: 290.1,
    co2: 660,
    temperature: 31.0,
    humidity: 54,
    batteryPct: 84,
    loraRssi: -75,
    lastPing: "18s ago",
  },
  {
    id: "bus-06",
    code: "SN-MOB-006",
    route: "South-West Express (Dwarka - Dhaula Kuan)",
    status: "ONLINE",
    lat: 28.5790,
    lon: 77.1420,
    speedKmh: 46.5,
    pm25: 110.2,
    pm10: 165.8,
    co2: 512,
    temperature: 30.5,
    humidity: 56,
    batteryPct: 93,
    loraRssi: -69,
    lastPing: "15s ago",
  },
];

const INITIAL_SENTINEL_RASTERS: SentinelRasterTile[] = [
  {
    id: "ras-ch4-ghazipur",
    gasType: "CH4",
    sectorName: "Ghazipur Landfill & Bio-methanation Zone",
    centerLat: 28.627,
    centerLon: 77.329,
    concentrationPpbOrPpm: 2480,
    unit: "ppb",
    anomalyScore: 94,
    orbitNumber: 42891,
    cloudFraction: 0.08,
  },
  {
    id: "ras-ch4-okhla",
    gasType: "CH4",
    sectorName: "Okhla Sewage Treatment & Solid Waste Flare",
    centerLat: 28.539,
    centerLon: 77.279,
    concentrationPpbOrPpm: 2210,
    unit: "ppb",
    anomalyScore: 82,
    orbitNumber: 42891,
    cloudFraction: 0.11,
  },
  {
    id: "ras-co2-badarpur",
    gasType: "CO2",
    sectorName: "Badarpur Industrial Corridor Flue Emission",
    centerLat: 28.511,
    centerLon: 77.308,
    concentrationPpbOrPpm: 795,
    unit: "ppm",
    anomalyScore: 89,
    orbitNumber: 42891,
    cloudFraction: 0.05,
  },
  {
    id: "ras-co2-anand",
    gasType: "CO2",
    sectorName: "Anand Vihar High-Density Diesel Freight Interchange",
    centerLat: 28.648,
    centerLon: 77.315,
    concentrationPpbOrPpm: 720,
    unit: "ppm",
    anomalyScore: 78,
    orbitNumber: 42891,
    cloudFraction: 0.07,
  },
];

const INITIAL_HOTSPOTS: EmissionHotspot[] = [
  {
    id: "HS-2026-1049",
    title: "Methane Super-Emitter Plume",
    sector: "Ghazipur Landfill Perimeter Sector-4",
    pollutant: "CH4",
    value: "2,480 ppb",
    baselineExceedance: "+36.2% above regional background",
    severity: "CRITICAL",
    detectedVia: "Sentinel-5P TropOMI Orbit #42891 + Bus SN-MOB-003",
    timestamp: "4 mins ago",
    lat: 28.627,
    lon: 77.329,
    status: "ACTIVE",
  },
  {
    id: "HS-2026-1048",
    title: "Severe Particulate Fugitive Spike",
    sector: "Okhla Phase-II Industrial Metal Fabricators",
    pollutant: "PM2.5",
    value: "384 µg/m³",
    baselineExceedance: "+540% over WHO 24h Guideline",
    severity: "CRITICAL",
    detectedVia: "Bus SN-MOB-002 Mesh Alert (Confirmed by CPCB Node 3)",
    timestamp: "12 mins ago",
    lat: 28.548,
    lon: 77.262,
    status: "DISPATCHED",
    assignedAction: "Enforcement Drone #Alpha-2 deployed",
  },
  {
    id: "HS-2026-1047",
    title: "Combustion Flue Gas Flare",
    sector: "Badarpur Power & Heavy Freight Hub",
    pollutant: "CO2",
    value: "795 ppm",
    baselineExceedance: "+89% localized CO2 anomaly",
    severity: "HIGH",
    detectedVia: "Sentinel-5P Tropospheric Infrared Swath",
    timestamp: "28 mins ago",
    lat: 28.511,
    lon: 77.308,
    status: "NOTICE_ISSUED",
    assignedAction: "Air Act Sec 31A Notice dispatched to operator",
  },
  {
    id: "HS-2026-1046",
    title: "Diesel Heavy Truck Corridor Congestion",
    sector: "Anand Vihar Inter-State Transit Gate 2",
    pollutant: "NO2",
    value: "168 ppb",
    baselineExceedance: "+110% morning commuter surge",
    severity: "ELEVATED",
    detectedVia: "Bus SN-MOB-001 & Stationary Sensor SN-DEL-002",
    timestamp: "45 mins ago",
    lat: 28.648,
    lon: 77.315,
    status: "ACTIVE",
  },
  {
    id: "HS-2026-1045",
    title: "Biomass Burning Containment",
    sector: "Narela Agri-Periphery Sector 12",
    pollutant: "PM2.5",
    value: "245 µg/m³",
    baselineExceedance: "Rapid drop after civic water misting",
    severity: "RESOLVED",
    detectedVia: "Satellite Thermal Anomaly + Municipal Drone",
    timestamp: "2 hours ago",
    lat: 28.845,
    lon: 77.098,
    status: "RESOLVED",
    assignedAction: "Civic smog gun teams successfully suppressed plume",
  },
];

export default function GovernmentDashboardPage() {
  // Layer toggles
  const [showSentinelCh4, setShowSentinelCh4] = useState<boolean>(true);
  const [showSentinelCo2, setShowSentinelCo2] = useState<boolean>(true);
  const [showBusMesh, setShowBusMesh] = useState<boolean>(true);
  const [showHotspotPins, setShowHotspotPins] = useState<boolean>(true);
  const [rasterOpacity, setRasterOpacity] = useState<number>(0.75);

  // Selected item inspectors
  const [selectedBus, setSelectedBus] = useState<BusMeshNode | null>(INITIAL_BUS_MESH[0]);
  const [selectedHotspot, setSelectedHotspot] = useState<EmissionHotspot | null>(INITIAL_HOTSPOTS[0]);
  const [hotspots, setHotspots] = useState<EmissionHotspot[]>(INITIAL_HOTSPOTS);
  const [hotspotFilter, setHotspotFilter] = useState<"ALL" | "CRITICAL" | "ACTIVE">("ALL");

  // UN SDG Tab
  const [activeSdgTab, setActiveSdgTab] = useState<"SDG11" | "SDG13">("SDG11");

  // Action dialog state
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Live timer simulation
  const [clockTime, setClockTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + " • " + now.toLocaleTimeString("en-US", { hour12: false }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered hotspots
  const filteredHotspots = hotspots.filter((h) => {
    if (hotspotFilter === "CRITICAL") return h.severity === "CRITICAL";
    if (hotspotFilter === "ACTIVE") return h.status === "ACTIVE" || h.status === "DISPATCHED";
    return true;
  });

  // Action Handlers
  const handleDispatchDrone = (hotspotId: string) => {
    setHotspots((prev) =>
      prev.map((h) =>
        h.id === hotspotId
          ? {
              ...h,
              status: "DISPATCHED",
              assignedAction: "Autonomous Enforcement Drone #Scout-9 deployed to coordinates",
            }
          : h
      )
    );
    setActionNotice(`Enforcement Drone successfully dispatched to Hotspot [${hotspotId}]`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleIssueNotice = (hotspotId: string) => {
    setHotspots((prev) =>
      prev.map((h) =>
        h.id === hotspotId
          ? {
              ...h,
              status: "NOTICE_ISSUED",
              assignedAction: "CPCB Air Act Section 31A Mandatory Rectification Order Transmitted",
            }
          : h
      )
    );
    setActionNotice(`Legal Notice Section 31A issued to plant authority for [${hotspotId}]`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleMarkResolved = (hotspotId: string) => {
    setHotspots((prev) =>
      prev.map((h) =>
        h.id === hotspotId
          ? {
              ...h,
              severity: "RESOLVED",
              status: "RESOLVED",
              assignedAction: "Verified within normal baseline bounds by ground telemetry",
            }
          : h
      )
    );
    setActionNotice(`Hotspot [${hotspotId}] marked as RESOLVED`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Government Clearance Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-b border-red-900/40 px-4 py-1.5 text-[11px] font-mono tracking-wider flex items-center justify-between">
        <div className="flex items-center space-x-2 text-red-300">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold">EXECUTIVE GOVERNMENT PORTAL</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">CENTRAL AIR POLLUTION CONTROL & CLIMATE ACTION DIRECTORATE</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400 text-[10px]">
          <span>CLASSIFICATION: <strong>OFFICIAL USE ONLY</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">NEXT SENTINEL-5P PASS: <strong>T-02:18:40</strong></span>
          <span className="text-slate-600">|</span>
          <span>{clockTime || "LIVE SYNCHRONIZED"}</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Government Air Quality & Hotspot Command Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ACTIVE COPERNICUS LINK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-scale fusion of ESA Sentinel-5P tropospheric gas rasters with mobile public transit bus mesh telemetry.
            </p>
          </div>
        </div>

        {/* Global Action Links */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Public Overview</span>
          </Link>

          <button
            onClick={() => {
              setActionNotice("Syncing real-time PostGIS layers and Sentinel-5P granules...");
              setTimeout(() => setActionNotice(null), 2500);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Sync Granules</span>
          </button>

          <a
            href="#sdg-report"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition flex items-center space-x-1.5"
          >
            <Award className="h-3.5 w-3.5" />
            <span>UN SDG Scorecard</span>
          </a>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-emerald-900/90 border-b border-emerald-500/60 text-emerald-100 px-4 py-2 text-xs font-medium flex items-center justify-between transition animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Metric KPI Ribbon */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sentinel-5P Orbit</span>
              <Satellite className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">#42891 <span className="text-xs font-normal text-emerald-400 font-mono">TropOMI</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">5.5 × 3.5 km macro resolution</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Bus Mesh Fleet</span>
              <Bus className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-300 mt-1">12/12 <span className="text-xs font-normal text-slate-400">Online</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">LoRaWAN 868MHz mesh telemetry</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Hotspots</span>
              <Flame className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div className="text-lg font-bold text-red-400 mt-1">
              {hotspots.filter((h) => h.severity === "CRITICAL").length} Critical
              <span className="text-xs font-normal text-slate-400 ml-1.5 font-mono">({hotspots.length} total)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Automated cross-scale triggers</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>UN SDG 11 Index</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 mt-1">76 / 100 <span className="text-xs font-normal text-emerald-400 font-mono">B+</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target 11.6.2 Air Quality Track</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 col-span-2 md:col-span-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>UN SDG 13 Score</span>
              <Globe className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-teal-300 mt-1">89 / 100 <span className="text-xs font-normal text-emerald-400 font-mono">Grade A</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Methane Mitigation Benchmark</div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Row 1: Interactive Spatial Map Canvas (with Layer Toggles) + Real-Time Hotspot Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spatial Canvas (Col 1 to 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col">
              {/* Spatial Map Header & Layer Controls Toolbar */}
              <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Spatial Hotspot Fusion Map</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Satellite Tropospheric Rasters (5.5km) fused with EV Transit Bus Mesh Points (10m).
                  </p>
                </div>

                {/* Layer Control Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  {/* Sentinel CH4 Toggle */}
                  <button
                    onClick={() => setShowSentinelCh4(!showSentinelCh4)}
                    className={`px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                      showSentinelCh4
                        ? "bg-purple-950/80 border-purple-600 text-purple-300"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Satellite className="h-3 w-3" />
                    <span>ESA Sentinel CH₄</span>
                  </button>

                  {/* Sentinel CO2 Toggle */}
                  <button
                    onClick={() => setShowSentinelCo2(!showSentinelCo2)}
                    className={`px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                      showSentinelCo2
                        ? "bg-amber-950/80 border-amber-600 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    <span>Sentinel CO₂ / NO₂</span>
                  </button>

                  {/* Bus Mesh Toggle */}
                  <button
                    onClick={() => setShowBusMesh(!showBusMesh)}
                    className={`px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                      showBusMesh
                        ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Bus className="h-3 w-3" />
                    <span>Bus Mesh ({INITIAL_BUS_MESH.length})</span>
                  </button>

                  {/* Hotspot Pins Toggle */}
                  <button
                    onClick={() => setShowHotspotPins(!showHotspotPins)}
                    className={`px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                      showHotspotPins
                        ? "bg-red-950/80 border-red-600 text-red-300"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>Hotspots</span>
                  </button>
                </div>
              </div>

              {/* Interactive Vector / Raster Canvas Display */}
              <div className="relative w-full h-[460px] bg-[#090e17] overflow-hidden select-none">
                {/* Simulated Geospatial Grid Lines */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Simulated Street Network Skeleton */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                  <path
                    d="M 40 180 Q 220 160 380 260 T 640 210"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 120 40 Q 200 240 320 440"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 460 30 Q 380 200 480 430"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <circle cx="280" cy="210" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="280" cy="210" r="48" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                </svg>

                {/* 1. Sentinel-5P Methane (CH4) Heatmap Macro Rasters */}
                {showSentinelCh4 && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: rasterOpacity }}
                  >
                    {/* Ghazipur Methane Plume Swath */}
                    <div
                      className="absolute rounded-full blur-2xl pointer-events-auto cursor-pointer"
                      style={{
                        top: "18%",
                        right: "12%",
                        width: "180px",
                        height: "180px",
                        background:
                          "radial-gradient(circle, rgba(236,72,153,0.85) 0%, rgba(147,51,234,0.65) 45%, rgba(59,130,246,0.3) 75%, transparent 100%)",
                      }}
                      onClick={() => {
                        const h = hotspots.find((x) => x.id === "HS-2026-1049");
                        if (h) setSelectedHotspot(h);
                      }}
                      title="Ghazipur Landfill CH4 Plume (2,480 ppb)"
                    />

                    {/* Okhla Methane Anomaly Swath */}
                    <div
                      className="absolute rounded-full blur-2xl pointer-events-auto cursor-pointer"
                      style={{
                        bottom: "16%",
                        right: "24%",
                        width: "150px",
                        height: "150px",
                        background:
                          "radial-gradient(circle, rgba(168,85,247,0.75) 0%, rgba(99,102,241,0.5) 50%, transparent 100%)",
                      }}
                      onClick={() => {
                        const h = hotspots.find((x) => x.id === "HS-2026-1048");
                        if (h) setSelectedHotspot(h);
                      }}
                      title="Okhla Waste Facility CH4 Flare (2,210 ppb)"
                    />
                  </div>
                )}

                {/* 2. Sentinel-5P CO2 / NO2 Thermal Corridor Raster */}
                {showSentinelCo2 && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: rasterOpacity * 0.85 }}
                  >
                    {/* Badarpur Flue Plume */}
                    <div
                      className="absolute rounded-full blur-2xl pointer-events-auto cursor-pointer"
                      style={{
                        bottom: "10%",
                        right: "16%",
                        width: "170px",
                        height: "170px",
                        background:
                          "radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(245,158,11,0.55) 55%, transparent 100%)",
                      }}
                      onClick={() => {
                        const h = hotspots.find((x) => x.id === "HS-2026-1047");
                        if (h) setSelectedHotspot(h);
                      }}
                      title="Badarpur Industrial CO2 Flue (795 ppm)"
                    />
                  </div>
                )}

                {/* 3. Real-Time Bus Mesh Points */}
                {showBusMesh && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {/* Visual LoRaWAN P2P Mesh Vectors between buses */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1="280"
                        y1="210"
                        x2="480"
                        y2="160"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                      <line
                        x1="480"
                        y1="160"
                        x2="420"
                        y2="340"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                      <line
                        x1="280"
                        y1="210"
                        x2="240"
                        y2="320"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                    </svg>

                    {/* Bus 01: Central Connaught Place */}
                    <div
                      onClick={() => setSelectedBus(INITIAL_BUS_MESH[0])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      style={{ top: "45%", left: "42%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 border border-emerald-300 text-white flex items-center justify-center shadow-lg shadow-emerald-950 group-hover:scale-125 transition">
                          <Bus className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono shadow-md">
                        SN-MOB-001 (142 µg/m³)
                      </div>
                    </div>

                    {/* Bus 02: Okhla Heavy Corridor */}
                    <div
                      onClick={() => setSelectedBus(INITIAL_BUS_MESH[1])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      style={{ top: "72%", left: "68%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                        <div className="w-7 h-7 rounded-lg bg-red-600 border border-red-300 text-white flex items-center justify-center shadow-lg shadow-red-950 group-hover:scale-125 transition">
                          <Bus className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-red-400 font-mono shadow-md">
                        SN-MOB-002 (284 µg/m³)
                      </div>
                    </div>

                    {/* Bus 03: East Delhi Landfill Bypass */}
                    <div
                      onClick={() => setSelectedBus(INITIAL_BUS_MESH[2])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      style={{ top: "35%", left: "82%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-amber-600 border border-amber-300 text-white flex items-center justify-center shadow-lg shadow-amber-950 group-hover:scale-125 transition">
                          <Bus className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono shadow-md">
                        SN-MOB-003 (312 µg/m³)
                      </div>
                    </div>

                    {/* Bus 04: Lodhi Ecological Zone */}
                    <div
                      onClick={() => setSelectedBus(INITIAL_BUS_MESH[3])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                      style={{ top: "66%", left: "38%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 border border-teal-300 text-white flex items-center justify-center shadow-lg shadow-teal-950 group-hover:scale-125 transition">
                          <Bus className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-teal-300 font-mono shadow-md">
                        SN-MOB-004 (58 µg/m³)
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Flagged Hotspot Pins */}
                {showHotspotPins && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {/* Hotspot 1: Ghazipur CH4 */}
                    <div
                      onClick={() => setSelectedHotspot(INITIAL_HOTSPOTS[0])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
                      style={{ top: "25%", left: "84%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-10 h-10 rounded-full bg-red-600/40 animate-ping" />
                        <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-xl group-hover:scale-125 transition">
                          <Flame className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Hotspot 2: Okhla PM2.5 */}
                    <div
                      onClick={() => setSelectedHotspot(INITIAL_HOTSPOTS[1])}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
                      style={{ top: "75%", left: "72%" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-amber-200 text-white flex items-center justify-center shadow-xl group-hover:scale-125 transition">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Map Floating HUD Legend */}
                <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-3 text-[11px] font-mono space-y-2 z-30 shadow-xl max-w-xs">
                  <div className="text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Active GIS Overlays</span>
                    <span className="text-[10px] text-cyan-400">EPSG:4326</span>
                  </div>
                  <div className="space-y-1.5 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded bg-purple-600 flex-shrink-0" />
                      <span>ESA Sentinel-5P Methane (CH₄ &gt; 2,200 ppb)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded bg-red-600 flex-shrink-0" />
                      <span>Sentinel-5P CO₂ Flue Plumes (&gt; 750 ppm)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
                      <span>EV Bus Mesh Nodes (LoRaWAN P2P)</span>
                    </div>
                  </div>

                  {/* Raster Opacity Slider */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                    <Sliders className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] text-slate-400">Opacity:</span>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={rasterOpacity}
                      onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Bus Telemetry Bar */}
              {selectedBus && (
                <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                      <Bus className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{selectedBus.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {selectedBus.route}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Speed: {selectedBus.speedKmh} km/h • Battery: {selectedBus.batteryPct}% • RSSI: {selectedBus.loraRssi} dBm
                      </div>
                    </div>
                  </div>

                  {/* Micro Telemetry Metrics */}
                  <div className="flex items-center space-x-4 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">PM2.5</span>
                      <div className={`font-bold ${selectedBus.pm25 > 200 ? "text-red-400" : "text-emerald-400"}`}>
                        {selectedBus.pm25} <span className="text-[10px] font-normal text-slate-500">µg/m³</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">CO2</span>
                      <div className="font-bold text-cyan-300">
                        {selectedBus.co2} <span className="text-[10px] font-normal text-slate-500">ppm</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Temp / Hum</span>
                      <div className="font-bold text-slate-200">
                        {selectedBus.temperature}°C / {selectedBus.humidity}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Hotspot Feed (Col 8 to 12) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex flex-col h-[550px]">
              {/* Feed Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>Real-Time Hotspot Feed</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono">
                        {filteredHotspots.length}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">Threshold breaches flagged for government intervention</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <LivePulseBadge statusText="HOTSPOT RADAR" color="rose" size="sm" />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  {(["ALL", "CRITICAL", "ACTIVE"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHotspotFilter(filter)}
                      className={`px-2 py-1 rounded transition font-mono ${
                        hotspotFilter === filter
                          ? "bg-slate-800 text-white font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Hotspot Alert List with Framer Motion Staggered Entrance */}
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                  },
                }}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 custom-scrollbar"
              >
                <AnimatePresence mode="popLayout">
                {filteredHotspots.map((hotspot) => {
                  const isSelected = selectedHotspot?.id === hotspot.id;
                  const isCritical = hotspot.severity === "CRITICAL";

                  return (
                    <motion.div
                      key={hotspot.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 14, scale: 0.98 },
                        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 15 } },
                      }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedHotspot(hotspot)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? "bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isCritical
                                ? "bg-red-950 text-red-300 border border-red-800/80 animate-pulse"
                                : hotspot.severity === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : hotspot.severity === "RESOLVED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}
                          >
                            {hotspot.severity}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{hotspot.id}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{hotspot.timestamp}</span>
                      </div>

                      <div className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                        <span>{hotspot.title}</span>
                        <span className="font-mono text-cyan-300">{hotspot.value}</span>
                      </div>

                      <div className="text-xs text-slate-300 mb-2 flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{hotspot.sector}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 mb-2.5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Exceedance</div>
                        <div className="text-amber-300 font-medium">{hotspot.baselineExceedance}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                          Sensor: {hotspot.detectedVia}
                        </div>
                      </div>

                      {/* Action Status / Quick Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        {hotspot.assignedAction ? (
                          <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1.5 truncate">
                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{hotspot.assignedAction}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-red-400 font-mono flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>Action Required</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1.5">
                          {hotspot.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDispatchDrone(hotspot.id);
                                }}
                                className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 text-[10px] font-mono transition flex items-center space-x-1"
                                title="Deploy enforcement drone with thermal/gas camera"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Drone</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIssueNotice(hotspot.id);
                                }}
                                className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 text-[10px] font-mono transition flex items-center space-x-1"
                                title="Issue Air Act Section 31A statutory notice"
                              >
                                <FileText className="h-2.5 w-2.5" />
                                <span>Sec 31A</span>
                              </button>
                            </>
                          )}
                          {hotspot.status !== "RESOLVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkResolved(hotspot.id);
                              }}
                              className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono transition"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Row 2: UN SDG 11 & SDG 13 Compliance Report Card Widget */}
        <section id="sdg-report" className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                <Award className="h-3.5 w-3.5" />
                <span>UNITED NATIONS 2030 SUSTAINABLE DEVELOPMENT AUDIT</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>UN SDG 11 & SDG 13 Urban Compliance Report Card</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-3xl">
                Statutory audit metrics tracking city-level ambient particulate matter reduction and methane super-emitter mitigation targets under COP-31 & UNEP urban standards.
              </p>
            </div>

            {/* SDG Selector Switch & PDF Export */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveSdgTab("SDG11")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeSdgTab === "SDG11"
                      ? "bg-amber-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>SDG 11 (Air & Cities)</span>
                </button>
                <button
                  onClick={() => setActiveSdgTab("SDG13")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeSdgTab === "SDG13"
                      ? "bg-teal-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>SDG 13 (Climate Action)</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setActionNotice("Generating official UN SDG Compliance Executive Brief PDF...");
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export Audit Brief</span>
              </button>
            </div>
          </div>

          {/* SDG Tab 1: SDG 11 (Sustainable Cities and Communities) */}
          {activeSdgTab === "SDG11" && (
            <div className="space-y-6">
              {/* Top Banner KPI Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-950 border border-amber-800/40">
                  <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Indicator 11.6.2</div>
                  <div className="text-2xl font-black text-white mt-1">58.4 <span className="text-xs font-normal text-slate-400">µg/m³</span></div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>-19.8 µg/m³ vs 2024 Baseline</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Population-weighted annual mean PM2.5</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">WHO PM2.5 Guideline Gap</div>
                  <div className="text-2xl font-black text-amber-300 mt-1">+289%</div>
                  <div className="text-xs text-slate-400 mt-1">National standard: 40 µg/m³ (In Progress)</div>
                  <div className="text-[10px] text-slate-500 mt-1">WHO Annual Cap: 15 µg/m³</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Clean Air Days (Q3)</div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">62 / 90 <span className="text-xs font-normal text-slate-400">Days</span></div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+14 days compared to 2025</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">AQI &lt; 100 within residential zones</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Overall SDG 11 Grade</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-center space-x-2">
                    <span>76 / 100</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">B+</span>
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">Tier-2 Improvement Trajectory</div>
                  <div className="text-[10px] text-slate-500 mt-1">Audit authority: CPCB & MoEFCC</div>
                </div>
              </div>

              {/* Detailed Indicator Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.6.1 Solid Waste & Landfill Smog</span>
                    <span className="font-mono text-amber-400 font-bold">81.2%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "81.2%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Remediation of bio-mining sites in Ghazipur & Bhalswa reducing open fugitive methane flares.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.2.1 Low-Emission Transit Access</span>
                    <span className="font-mono text-emerald-400 font-bold">88.5%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "88.5%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Urban population within 500m of clean EV public bus corridors and metro feeder lines.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.7.1 School & Hospital Buffers</span>
                    <span className="font-mono text-cyan-400 font-bold">92.0%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: "92.0%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enforced 300m low-speed restriction zones around pediatric and eldercare health centers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SDG Tab 2: SDG 13 (Climate Action & Methane Mitigation) */}
          {activeSdgTab === "SDG13" && (
            <div className="space-y-6">
              {/* Top Banner KPI Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-950/40 to-slate-950 border border-teal-800/40">
                  <div className="text-[11px] font-mono text-teal-400 uppercase tracking-wider">Methane Abatement Rate</div>
                  <div className="text-2xl font-black text-white mt-1">82.4%</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+18.2% YoY Detection & Sealing</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Super-emitter leaks capped &lt; 2 hours</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg Hotspot Response Speed</div>
                  <div className="text-2xl font-black text-teal-300 mt-1">1.8 <span className="text-xs font-normal text-slate-400">Hours</span></div>
                  <div className="text-xs text-emerald-400 mt-1">UNEP IMEO Global Standard: &lt; 24h</div>
                  <div className="text-[10px] text-slate-500 mt-1">Drone survey & civic command dispatch</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GHG Net Reduction</div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">-18.4%</div>
                  <div className="text-xs text-slate-400 mt-1">2026 Milestone on track (-25% by 2030)</div>
                  <div className="text-[10px] text-slate-500 mt-1">Measured via Sentinel-5P + ground mesh</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Overall SDG 13 Grade</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-center space-x-2">
                    <span>89 / 100</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40">Grade A</span>
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">COP-31 City Benchmark Compliance</div>
                  <div className="text-[10px] text-slate-500 mt-1">Audit authority: UNEP IMEO Verified</div>
                </div>
              </div>

              {/* Detailed Indicator Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.2.1 Tropospheric Methane Flaring</span>
                    <span className="font-mono text-teal-400 font-bold">94.1%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: "94.1%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Continuous TropOMI orbital monitoring suppressing runaway landfill and pipeline methane leaks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.3.1 Civic Climate Early Warning</span>
                    <span className="font-mono text-emerald-400 font-bold">96.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96.8%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Real-time automated alerts broadcast to hospital ICUs, schools, and civic transport fleet within 3 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.1.2 Industrial Fugitive Compliance</span>
                    <span className="font-mono text-amber-400 font-bold">78.0%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "78.0%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Active CPCB automated scrutiny for 142 industrial units across Okhla, Badarpur, and Bawana corridors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">AetherGrid Executive Environmental Portal</span>
            <span>• Ministry of Environment, Forest & Climate Change</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            Data Sources: ESA Sentinel-5P TropOMI • Delhi Bus Transit LoRaWAN Mesh • PostGIS 3.4
          </div>
        </div>
      </footer>
    </div>
  );
}
