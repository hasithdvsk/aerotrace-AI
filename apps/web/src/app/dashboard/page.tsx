"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LivePulseBadge from "@/components/animations/LivePulseBadge";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import HotspotMap from "@/components/HotspotMap";
import VulnerabilityScoreCard from "@/components/VulnerabilityScoreCard";
import ReportCard from "@/components/ReportCard";
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 min-h-screen bg-obsidian-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Main View Column: lg:col-span-7 xl:col-span-8 flex flex-col gap-6 */}
      <main className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 min-w-0">
        {/* Top Government Authority Meta Bar */}
        <div className="bg-obsidian-950/80 backdrop-blur-2xl border border-crimson-neon-500/30 px-4 py-2.5 text-[11px] font-mono tracking-wider flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-2xl glass-card">
          <div className="flex items-center space-x-2 text-crimson-neon-300">
            <span className="inline-block w-2 h-2 rounded-full bg-crimson-neon-500 animate-pulse shadow-glow-crimson" />
            <span className="font-bold">EXECUTIVE GOVERNMENT PORTAL</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">CENTRAL AIR POLLUTION CONTROL &amp; CLIMATE ACTION</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-[10px]">
            <span>CLASSIFICATION: <strong className="text-white">OFFICIAL USE ONLY</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-cyber-400">{clockTime || "LIVE SYNCHRONIZED"}</span>
          </div>
        </div>

        {/* Main Header */}
        <header className="border border-white/10 glass-card bg-obsidian-950/80 backdrop-blur-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-violet-satellite-500/15 border border-violet-satellite-500/40 text-violet-satellite-400 shadow-glow-violet flex-shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h1 className="text-lg font-black tracking-tight text-gradient-satellite truncate">
                  Government Air Quality &amp; Hotspot Command Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-cyber-500/20 text-emerald-cyber-300 border border-emerald-cyber-500/40 font-mono shadow-glow-emerald flex-shrink-0">
                  ACTIVE COPERNICUS LINK
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                Multi-scale fusion of ESA Sentinel-5P tropospheric gas rasters with mobile public transit bus mesh telemetry.
              </p>
            </div>
          </div>

          {/* Global Action Links */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl glass-card hover:border-cyan-electric-500/40 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-cyan-electric-400" />
              <span>Public Overview</span>
            </Link>

            <button
              onClick={() => {
                setActionNotice("Syncing real-time PostGIS layers and Sentinel-5P granules...");
                setTimeout(() => setActionNotice(null), 2500);
              }}
              className="px-3 py-1.5 rounded-xl glass-card hover:border-emerald-cyber-500/40 text-slate-200 text-xs font-semibold border border-white/10 transition flex items-center space-x-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-cyber-400" />
              <span>Sync</span>
            </button>

            <a
              href="#sdg-report"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-cyber-500 to-teal-500 hover:from-emerald-cyber-400 hover:to-teal-400 text-obsidian-950 text-xs font-bold shadow-glow-emerald transition flex items-center space-x-1.5"
            >
              <Award className="h-3.5 w-3.5" />
              <span>UN SDG</span>
            </a>
          </div>
        </header>

        {/* Action Notification Toast */}
        {actionNotice && (
          <div className="glass-card border border-emerald-cyber-500/50 bg-emerald-cyber-500/20 text-emerald-200 px-4 py-2.5 text-xs font-mono font-medium flex items-center justify-between transition animate-in fade-in slide-in-from-top duration-300 rounded-xl shadow-glow-emerald">
            <div className="flex items-center space-x-2 w-full">
              <CheckCircle2 className="h-4 w-4 text-emerald-cyber-300 flex-shrink-0" />
              <span>{actionNotice}</span>
            </div>
          </div>
        )}

        {/* Metric KPI Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sentinel-5P</span>
              <Satellite className="h-3.5 w-3.5 text-cyan-electric-400" />
            </div>
            <div className="text-base font-bold text-white mt-1 font-mono">#42891 <span className="text-xs font-normal text-emerald-cyber-400">TropOMI</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">5.5 × 3.5 km macro</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Bus Mesh</span>
              <Bus className="h-3.5 w-3.5 text-emerald-cyber-400" />
            </div>
            <div className="text-base font-bold text-emerald-cyber-300 mt-1 font-mono">12/12 <span className="text-xs font-normal text-slate-400">Online</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">LoRaWAN 868MHz</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border border-crimson-neon-500/30 shadow-glow-crimson">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Hotspots</span>
              <Flame className="h-3.5 w-3.5 text-crimson-neon-400 animate-pulse" />
            </div>
            <div className="text-base font-bold text-crimson-neon-400 mt-1 font-mono">
              {hotspots.filter((h) => h.severity === "CRITICAL").length} Critical
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">Automated triggers</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border border-white/10">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>SDG 11</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-base font-bold text-amber-300 mt-1 font-mono">76 / 100 <span className="text-xs font-bold text-emerald-cyber-400 px-1 py-0.2 rounded bg-emerald-cyber-500/20 border border-emerald-cyber-500/30">B+</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">Target 11.6.2 Track</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card glass-card-hover border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>SDG 13</span>
              <Globe className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <div className="text-base font-bold text-teal-300 mt-1 font-mono">89 / 100 <span className="text-xs font-bold text-emerald-cyber-400 px-1 py-0.2 rounded bg-emerald-cyber-500/20 border border-emerald-cyber-500/30">A</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">Methane Benchmark</div>
          </div>
        </section>

        {/* Interactive Spatial Map Canvas (with Layer Classification Legend) */}
        <section className="flex flex-col gap-4">
          <HotspotMap
            hotspots={hotspots as any}
            selectedHotspot={selectedHotspot as any}
            onSelectHotspot={(spot) => setSelectedHotspot(spot as any)}
            className="h-[620px]"
          />

          {/* Selected Bus Telemetry Bar */}
          {selectedBus && (
            <div className="p-3.5 glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs rounded-2xl">
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
        </section>

        {/* UN SDG Report Card Component (3-column subgrid layout) */}
        <ReportCard
          activeSdgTab={activeSdgTab}
          onTabChange={setActiveSdgTab}
          onExportBrief={() => {
            setActionNotice("Generating official UN SDG Compliance Executive Brief PDF...");
            setTimeout(() => setActionNotice(null), 3000);
          }}
        />

        {/* Footer */}
        <footer className="glass-card p-4 border border-white/10 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-2xl">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-cyber-400" />
            <span className="font-semibold text-slate-300">AetherGrid Command Portal</span>
            <span>• MoEFCC &amp; CPCB</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            ESA Sentinel-5P TropOMI • Bus Transit Mesh • PostGIS 3.4
          </div>
        </footer>
      </main>

      {/* Right Alert Sidebar Column: lg:col-span-5 xl:col-span-4 flex flex-col gap-4 */}
      <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 min-w-0">
        <VulnerabilityScoreCard
          score={84.6}
          title="Urban Vulnerability Index"
          subSector="National Capital Region • Environmental Enforcement"
          hotspots={hotspots as any}
          onSelectHotspot={(spot) => setSelectedHotspot(spot as any)}
        />

        {/* Quick Statutory Enforcement Actions Strip for Selected Hotspot */}
        {selectedHotspot && (
          <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col gap-3 text-xs shadow-xl backdrop-blur-xl">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-crimson-neon-500/20 border border-crimson-neon-500/40 text-crimson-neon-400 shadow-glow-crimson flex-shrink-0">
                <Flame className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white truncate flex items-center space-x-2">
                  <span className="truncate">{selectedHotspot.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-crimson-neon-500/20 text-crimson-neon-300 border border-crimson-neon-500/40 flex-shrink-0">
                    {selectedHotspot.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {selectedHotspot.assignedAction || "Action required: Ground verification or statutory notice"}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
              {selectedHotspot.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => handleDispatchDrone(selectedHotspot.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-crimson-neon-500/20 hover:bg-crimson-neon-500/30 border border-crimson-neon-500/50 text-crimson-neon-300 text-[10px] font-mono font-bold transition flex items-center justify-center space-x-1.5 shadow-glow-crimson"
                    title="Deploy enforcement drone with gas/thermal camera"
                  >
                    <Send className="h-3 w-3" />
                    <span>Deploy Drone</span>
                  </button>
                  <button
                    onClick={() => handleIssueNotice(selectedHotspot.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold transition flex items-center justify-center space-x-1.5"
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-cyber-500/20 hover:bg-emerald-cyber-500/30 border border-emerald-cyber-500/50 text-emerald-cyber-300 text-[10px] font-mono font-bold transition flex items-center justify-center space-x-1.5 shadow-glow-emerald"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Resolve</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
