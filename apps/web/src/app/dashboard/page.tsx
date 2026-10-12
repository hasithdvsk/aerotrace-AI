"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LivePulseBadge from "@/components/animations/LivePulseBadge";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import HotspotMap from "@/components/HotspotMap";
import VulnerabilityScoreCard from "@/components/VulnerabilityScoreCard";
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
    <div className="min-h-screen cyber-grid-bg text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Government Clearance Banner */}
      <div className="bg-obsidian-950/80 backdrop-blur-2xl border-b border-crimson-neon-500/30 px-4 py-2 text-[11px] font-mono tracking-wider flex items-center justify-between glass-card rounded-none">
        <div className="flex items-center space-x-2 text-crimson-neon-300">
          <span className="inline-block w-2 h-2 rounded-full bg-crimson-neon-500 animate-pulse shadow-glow-crimson" />
          <span className="font-bold">EXECUTIVE GOVERNMENT PORTAL</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">CENTRAL AIR POLLUTION CONTROL & CLIMATE ACTION DIRECTORATE</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400 text-[10px]">
          <span>CLASSIFICATION: <strong className="text-white">OFFICIAL USE ONLY</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-electric-400">NEXT SENTINEL-5P PASS: <strong className="text-cyan-electric-300">T-02:18:40</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-cyber-400">{clockTime || "LIVE SYNCHRONIZED"}</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-white/10 glass-card bg-obsidian-950/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-violet-satellite-500/15 border border-violet-satellite-500/40 text-violet-satellite-400 shadow-glow-violet">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-gradient-satellite">
                Government Air Quality & Hotspot Command Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-cyber-500/20 text-emerald-cyber-300 border border-emerald-cyber-500/40 font-mono shadow-glow-emerald">
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
            className="px-3.5 py-1.5 rounded-xl glass-card hover:border-cyan-electric-500/40 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-electric-400" />
            <span>Public Overview</span>
          </Link>

          <button
            onClick={() => {
              setActionNotice("Syncing real-time PostGIS layers and Sentinel-5P granules...");
              setTimeout(() => setActionNotice(null), 2500);
            }}
            className="px-3.5 py-1.5 rounded-xl glass-card hover:border-emerald-cyber-500/40 text-slate-200 text-xs font-semibold border border-white/10 transition flex items-center space-x-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-cyber-400" />
            <span>Sync Granules</span>
          </button>

          <a
            href="#sdg-report"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-cyber-500 to-teal-500 hover:from-emerald-cyber-400 hover:to-teal-400 text-obsidian-950 text-xs font-bold shadow-glow-emerald transition flex items-center space-x-1.5"
          >
            <Award className="h-3.5 w-3.5" />
            <span>UN SDG Scorecard</span>
          </a>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="glass-card border-b border-emerald-cyber-500/50 bg-emerald-cyber-500/20 text-emerald-200 px-4 py-2 text-xs font-mono font-medium flex items-center justify-between transition animate-in fade-in slide-in-from-top duration-300 rounded-none shadow-glow-emerald">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-cyber-300 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Metric KPI Ribbon */}
      <section className="border-b border-white/10 bg-obsidian-950/60 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sentinel-5P Orbit</span>
              <Satellite className="h-3.5 w-3.5 text-cyan-electric-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1 font-mono">#42891 <span className="text-xs font-normal text-emerald-cyber-400">TropOMI</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">5.5 × 3.5 km macro resolution</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Bus Mesh Fleet</span>
              <Bus className="h-3.5 w-3.5 text-emerald-cyber-400" />
            </div>
            <div className="text-lg font-bold text-emerald-cyber-300 mt-1 font-mono">12/12 <span className="text-xs font-normal text-slate-400">Online</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">LoRaWAN 868MHz mesh telemetry</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border-crimson-neon-500/30 shadow-glow-crimson">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Hotspots</span>
              <Flame className="h-3.5 w-3.5 text-crimson-neon-400 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-crimson-neon-400 mt-1 font-mono">
              {hotspots.filter((h) => h.severity === "CRITICAL").length} Critical
              <span className="text-xs font-normal text-slate-400 ml-1.5 font-mono">({hotspots.length} total)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Automated cross-scale triggers</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>UN SDG 11 Index</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 mt-1 font-mono">76 / 100 <span className="text-xs font-bold text-emerald-cyber-400 px-1.5 py-0.5 rounded bg-emerald-cyber-500/20 border border-emerald-cyber-500/30">B+</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Target 11.6.2 Air Quality Track</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border-white/10 col-span-2 md:col-span-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>UN SDG 13 Score</span>
              <Globe className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-teal-300 mt-1 font-mono">89 / 100 <span className="text-xs font-bold text-emerald-cyber-400 px-1.5 py-0.5 rounded bg-emerald-cyber-500/20 border border-emerald-cyber-500/30">Grade A</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Methane Mitigation Benchmark</div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Row 1: Interactive Spatial Map Canvas (with Layer Toggles) + Real-Time Hotspot Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spatial Canvas (Col 1 to 7) */}
          <div className="lg:col-span-7 space-y-4">
            <HotspotMap
              hotspots={hotspots as any}
              selectedHotspot={selectedHotspot as any}
              onSelectHotspot={(spot) => setSelectedHotspot(spot as any)}
              className="h-[620px]"
            />

            {/* Selected Bus Telemetry Bar */}
            {selectedBus && (
              <div className="p-3.5 glass-card border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-cyber-500/20 border border-emerald-cyber-500/40 text-emerald-cyber-400 shadow-glow-emerald">
                    <Bus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center space-x-2">
                      <span className="font-mono">{selectedBus.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-obsidian-900 border border-white/10 text-slate-300 font-mono">
                        {selectedBus.route}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Speed: {selectedBus.speedKmh} km/h • Battery: {selectedBus.batteryPct}% • RSSI: {selectedBus.loraRssi} dBm
                    </div>
                  </div>
                </div>

                {/* Micro Telemetry Metrics */}
                <div className="flex items-center space-x-4 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">PM2.5</span>
                    <div className={`font-bold ${selectedBus.pm25 > 200 ? "text-crimson-neon-400" : "text-emerald-cyber-400"}`}>
                      {selectedBus.pm25} <span className="text-[10px] font-normal text-slate-500">µg/m³</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">CO2</span>
                    <div className="font-bold text-cyan-electric-400">
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

          {/* Real-Time Vulnerability & Hotspots (Col 8 to 12) */}
          <div className="lg:col-span-5 space-y-4">
            <VulnerabilityScoreCard
              score={84.6}
              title="Urban Vulnerability Index"
              subSector="National Capital Region • Environmental Enforcement"
              hotspots={hotspots as any}
              onSelectHotspot={(spot) => setSelectedHotspot(spot as any)}
              className="h-[620px]"
            />

            {/* Quick Statutory Enforcement Actions Strip for Selected Hotspot */}
            {selectedHotspot && (
              <div className="p-3.5 glass-card border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-crimson-neon-500/20 border border-crimson-neon-500/40 text-crimson-neon-400 shadow-glow-crimson flex-shrink-0">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate flex items-center space-x-2">
                      <span className="truncate">{selectedHotspot.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-crimson-neon-500/20 text-crimson-neon-300 border border-crimson-neon-500/40 flex-shrink-0">
                        {selectedHotspot.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {selectedHotspot.assignedAction || "Action required: Ground verification or statutory notice"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {selectedHotspot.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => handleDispatchDrone(selectedHotspot.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-crimson-neon-500/20 hover:bg-crimson-neon-500/30 border border-crimson-neon-500/50 text-crimson-neon-300 text-[10px] font-mono font-bold transition flex items-center space-x-1 shadow-glow-crimson"
                        title="Deploy enforcement drone with gas/thermal camera"
                      >
                        <Send className="h-3 w-3" />
                        <span>Deploy Drone</span>
                      </button>
                      <button
                        onClick={() => handleIssueNotice(selectedHotspot.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold transition flex items-center space-x-1"
                        title="Issue Air Act Section 31A notice"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Sec 31A</span>
                      </button>
                    </>
                  )}
                  {selectedHotspot.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleMarkResolved(selectedHotspot.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-cyber-500/20 hover:bg-emerald-cyber-500/30 border border-emerald-cyber-500/50 text-emerald-cyber-300 text-[10px] font-mono font-bold transition flex items-center space-x-1 shadow-glow-emerald"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: UN SDG 11 & SDG 13 Compliance Report Card Widget */}
        <section id="sdg-report" className="glass-card border-white/10 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-cyber-400 bg-emerald-cyber-500/10 px-3 py-1 rounded-full border border-emerald-cyber-500/30 font-mono">
                <Award className="h-3.5 w-3.5 text-emerald-cyber-400" />
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
              <div className="flex bg-obsidian-950/90 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveSdgTab("SDG11")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 font-mono ${
                    activeSdgTab === "SDG11"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>SDG 11 (Air & Cities)</span>
                </button>
                <button
                  onClick={() => setActiveSdgTab("SDG13")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 font-mono ${
                    activeSdgTab === "SDG13"
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
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
                className="px-3.5 py-2 rounded-xl glass-card border-white/10 hover:border-cyan-electric-500/40 text-white text-xs font-semibold flex items-center space-x-1.5 transition font-mono"
              >
                <Download className="h-3.5 w-3.5 text-cyan-electric-400" />
                <span>Export Audit Brief</span>
              </button>
            </div>
          </div>

          {/* SDG Tab 1: SDG 11 (Sustainable Cities and Communities) */}
          {activeSdgTab === "SDG11" && (
            <div className="space-y-6">
              {/* Top Banner KPI Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl glass-card border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-obsidian-950">
                  <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Indicator 11.6.2</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono">58.4 <span className="text-xs font-normal text-slate-400">µg/m³</span></div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>-19.8 µg/m³ vs 2024 Baseline</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Population-weighted annual mean PM2.5</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">WHO PM2.5 Guideline Gap</div>
                  <div className="text-2xl font-black text-amber-300 mt-1 font-mono">+289%</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">National standard: 40 µg/m³ (In Progress)</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">WHO Annual Cap: 15 µg/m³</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Clean Air Days (Q3)</div>
                  <div className="text-2xl font-black text-emerald-cyber-400 mt-1 font-mono">62 / 90 <span className="text-xs font-normal text-slate-400">Days</span></div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+14 days compared to 2025</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">AQI &lt; 100 within residential zones</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Overall SDG 11 Grade</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-center space-x-2 font-mono">
                    <span>76 / 100</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">B+</span>
                  </div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 font-mono">Tier-2 Improvement Trajectory</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Audit authority: CPCB & MoEFCC</div>
                </div>
              </div>

              {/* Detailed Indicator Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.6.1 Solid Waste & Landfill Smog</span>
                    <span className="font-mono text-amber-400 font-bold">81.2%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "81.2%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Remediation of bio-mining sites in Ghazipur & Bhalswa reducing open fugitive methane flares.
                  </p>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.2.1 Low-Emission Transit Access</span>
                    <span className="font-mono text-emerald-cyber-400 font-bold">88.5%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-emerald-cyber-500 h-full rounded-full" style={{ width: "88.5%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Urban population within 500m of clean EV public bus corridors and metro feeder lines.
                  </p>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">11.7.1 School & Hospital Buffers</span>
                    <span className="font-mono text-cyan-electric-400 font-bold">92.0%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-cyan-electric-500 h-full rounded-full" style={{ width: "92.0%" }} />
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
                <div className="p-4 rounded-xl glass-card border-teal-500/30 bg-gradient-to-br from-teal-950/30 to-obsidian-950">
                  <div className="text-[11px] font-mono text-teal-400 uppercase tracking-wider">Methane Abatement Rate</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono">82.4%</div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+18.2% YoY Detection & Sealing</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Super-emitter leaks capped &lt; 2 hours</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg Hotspot Response Speed</div>
                  <div className="text-2xl font-black text-teal-300 mt-1 font-mono">1.8 <span className="text-xs font-normal text-slate-400">Hours</span></div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 font-mono">UNEP IMEO Global Standard: &lt; 24h</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Drone survey & civic command dispatch</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GHG Net Reduction</div>
                  <div className="text-2xl font-black text-emerald-cyber-400 mt-1 font-mono">-18.4%</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">2026 Milestone on track (-25% by 2030)</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Measured via Sentinel-5P + ground mesh</div>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Overall SDG 13 Grade</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-center space-x-2 font-mono">
                    <span>89 / 100</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40">Grade A</span>
                  </div>
                  <div className="text-xs text-emerald-cyber-400 mt-1 font-mono">COP-31 City Benchmark Compliance</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Audit authority: UNEP IMEO Verified</div>
                </div>
              </div>

              {/* Detailed Indicator Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.2.1 Tropospheric Methane Flaring</span>
                    <span className="font-mono text-teal-400 font-bold">94.1%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: "94.1%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Continuous TropOMI orbital monitoring suppressing runaway landfill and pipeline methane leaks.
                  </p>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.3.1 Civic Climate Early Warning</span>
                    <span className="font-mono text-emerald-cyber-400 font-bold">96.8%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-emerald-cyber-500 h-full rounded-full" style={{ width: "96.8%" }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Real-time automated alerts broadcast to hospital ICUs, schools, and civic transport fleet within 3 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-xl glass-card border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">13.1.2 Industrial Fugitive Compliance</span>
                    <span className="font-mono text-amber-400 font-bold">78.0%</span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
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
      <footer className="border-t border-white/10 bg-obsidian-950/80 backdrop-blur-2xl py-6 text-xs text-slate-500 glass-card rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-cyber-400" />
            <span className="font-semibold text-slate-300">AetherGrid Executive Environmental Portal</span>
            <span>• Ministry of Environment, Forest & Climate Change</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            Data Sources: ESA Sentinel-5P TropOMI • Chennai & Delhi Bus Transit LoRaWAN Mesh • PostGIS 3.4
          </div>
        </div>
      </footer>
    </div>
  );
}
