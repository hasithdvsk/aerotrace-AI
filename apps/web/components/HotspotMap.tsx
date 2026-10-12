"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Satellite,
  Radio,
  Layers,
  MapPin,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
  Filter,
  ShieldCheck,
  TrendingUp,
  Activity,
  Crosshair,
} from "lucide-react";
import AnimatedCounter from "./animations/AnimatedCounter";
import LivePulseBadge from "./animations/LivePulseBadge";
import type { EmissionHotspotItem } from "./VulnerabilityScoreCard";

export interface HotspotMapProps {
  hotspots?: EmissionHotspotItem[];
  selectedHotspot?: EmissionHotspotItem | null;
  onSelectHotspot?: (hotspot: EmissionHotspotItem) => void;
  className?: string;
}

const DEFAULT_HOTSPOTS: EmissionHotspotItem[] = [
  {
    id: "spot-01",
    title: "Manali Petrochemical & Refinery Complex",
    sector: "North Chennai Industrial Belt (Ennore)",
    pollutant: "PM2.5",
    value: "265.4 µg/m³",
    baselineExceedance: "+342%",
    severity: "CRITICAL",
    detectedVia: "BUS-NODE-301 (Route 309)",
    timestamp: "2 mins ago",
    lat: 13.175,
    lon: 80.268,
    status: "ACTIVE",
  },
  {
    id: "spot-02",
    title: "Ambattur Heavy Industrial Estate",
    sector: "Zone 7 Western Manufacturing Corridor",
    pollutant: "CO2",
    value: "1,180 ppm",
    baselineExceedance: "+195%",
    severity: "HIGH",
    detectedVia: "BUS-NODE-201 (Route 204)",
    timestamp: "6 mins ago",
    lat: 13.0982,
    lon: 80.1623,
    status: "DISPATCHED",
  },
  {
    id: "spot-03",
    title: "Chennai Port Container Terminal & Harbor",
    sector: "Marine Diesel & Freight Logistics Zone",
    pollutant: "PM2.5",
    value: "184.2 µg/m³",
    baselineExceedance: "+130%",
    severity: "HIGH",
    detectedVia: "BUS-NODE-102 (Route 101)",
    timestamp: "12 mins ago",
    lat: 13.088,
    lon: 80.298,
    status: "ACTIVE",
  },
  {
    id: "spot-04",
    title: "Anand Vihar / East Transit Interchange",
    sector: "Inter-State Bus Terminal Hub",
    pollutant: "NO2",
    value: "94.2 ppb",
    baselineExceedance: "+78%",
    severity: "ELEVATED",
    detectedVia: "BUS-NODE-101 (Route 101)",
    timestamp: "18 mins ago",
    lat: 13.0827,
    lon: 80.2755,
    status: "ACTIVE",
  },
];

export default function HotspotMap({
  hotspots = DEFAULT_HOTSPOTS,
  selectedHotspot,
  onSelectHotspot,
  className = "",
}: HotspotMapProps) {
  const [activeSpot, setActiveSpot] = useState<EmissionHotspotItem>(
    selectedHotspot || hotspots[0]
  );
  const [showSatelliteLayer, setShowSatelliteLayer] = useState<boolean>(true);
  const [showTransitMesh, setShowTransitMesh] = useState<boolean>(true);

  const handleSelect = (spot: EmissionHotspotItem) => {
    setActiveSpot(spot);
    if (onSelectHotspot) onSelectHotspot(spot);
  };

  return (
    <div
      className={`relative w-full h-[620px] rounded-3xl overflow-hidden glass-card border border-white/10 bg-obsidian-950/90 text-slate-100 flex flex-col shadow-2xl ${className}`}
    >
      {/* Top Floating HUD Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2.5 p-2 rounded-2xl glass-card border-white/10 backdrop-blur-2xl shadow-xl">
          <div className="p-2 rounded-xl bg-crimson-neon-500/15 border border-crimson-neon-500/40 text-crimson-neon-400 shadow-glow-crimson">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <span className="text-gradient-satellite">Industrial Emissions Plume Tracker</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-crimson-neon-500/20 text-crimson-neon-300 font-mono font-bold border border-crimson-neon-500/40">
                LIVE POSTGIS GI-ST
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sentinel-5P NO₂ tropospheric column macro-layer × LoRaWAN transit mesh
            </p>
          </div>
        </div>

        {/* Layer Toggle Pills */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={() => setShowSatelliteLayer(!showSatelliteLayer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center space-x-1.5 transition border ${
              showSatelliteLayer
                ? "bg-violet-satellite-500/20 text-violet-satellite-300 border-violet-satellite-500/50 shadow-glow-violet"
                : "bg-obsidian-900/80 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
          >
            <Satellite className="h-3.5 w-3.5" />
            <span>Sentinel-5P Layer</span>
          </button>

          <button
            onClick={() => setShowTransitMesh(!showTransitMesh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center space-x-1.5 transition border ${
              showTransitMesh
                ? "bg-emerald-cyber-500/20 text-emerald-cyber-300 border-emerald-cyber-500/50 shadow-glow-emerald"
                : "bg-obsidian-900/80 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Transit Fleet Mesh</span>
          </button>
        </div>
      </div>

      {/* Main Spatial Map Visualizer Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-obsidian-950">
        {/* Spatial Grid Backdrop */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1000 600"
        >
          <defs>
            <radialGradient id="satelliteGlow" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="plumeCritical" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#e11d48" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#9f1239" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="plumeHigh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#d97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </radialGradient>

            <filter id="plumeFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Coordinate Grid Lines */}
          <g opacity="0.15">
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 60}
                x2="1000"
                y2={i * 60}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 60}
                y1="0"
                x2={i * 60}
                y2="600"
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            ))}
          </g>

          {/* Satellite Macro Swath Layer (Violet Accents) */}
          {showSatelliteLayer && (
            <g>
              <ellipse
                cx="580"
                cy="280"
                rx="380"
                ry="220"
                fill="url(#satelliteGlow)"
              />
              <path
                d="M 150,80 Q 550,220 920,180"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeDasharray="6 8"
                opacity="0.45"
              />
            </g>
          )}

          {/* Simulated Bus Corridor Transit Paths (Emerald Cyber Lines) */}
          {showTransitMesh && (
            <g opacity="0.6">
              <path
                d="M 120,480 C 240,320 420,380 620,240 S 840,160 900,120"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
              <path
                d="M 280,520 C 380,410 490,290 710,210"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
            </g>
          )}

          {/* Plume Dispersions (Crimson Neon & Amber Glow) */}
          {/* Manali Petrochemical */}
          <circle
            cx="640"
            cy="190"
            r="110"
            fill="url(#plumeCritical)"
            filter="url(#plumeFilter)"
          />
          {/* Ambattur Heavy Industrial */}
          <circle
            cx="320"
            cy="310"
            r="85"
            fill="url(#plumeHigh)"
            filter="url(#plumeFilter)"
          />
          {/* Port Container Terminal */}
          <circle
            cx="780"
            cy="270"
            r="90"
            fill="url(#plumeHigh)"
            filter="url(#plumeFilter)"
          />
          {/* Anand Vihar Interchange */}
          <circle
            cx="490"
            cy="390"
            r="70"
            fill="url(#plumeHigh)"
            filter="url(#plumeFilter)"
          />
        </svg>

        {/* Hotspot Interactive Ping Markers */}
        <div className="absolute inset-0 pointer-events-auto">
          {/* 1. Manali Petrochem */}
          <div
            onClick={() => handleSelect(hotspots[0])}
            style={{ left: "64%", top: "32%" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-12 w-12 rounded-full bg-crimson-neon-500/40 animate-ping" />
              <span className="absolute h-8 w-8 rounded-full bg-crimson-neon-500/60 shadow-glow-crimson" />
              <div className="relative h-6 w-6 rounded-full bg-crimson-neon-500 border-2 border-white flex items-center justify-center text-white shadow-xl">
                <Flame className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg glass-card border-crimson-neon-500/50 text-[10px] font-mono font-bold text-white shadow-glow-crimson">
              Manali Complex: 265.4 µg/m³
            </div>
          </div>

          {/* 2. Ambattur Estate */}
          <div
            onClick={() => handleSelect(hotspots[1])}
            style={{ left: "32%", top: "52%" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-10 w-10 rounded-full bg-amber-500/30 animate-ping" />
              <span className="absolute h-6 w-6 rounded-full bg-amber-500/50" />
              <div className="relative h-5 w-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950">
                <AlertTriangle className="h-3 w-3" />
              </div>
            </div>
            <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg glass-card border-amber-500/40 text-[10px] font-mono font-bold text-slate-200">
              Ambattur: 1,180 ppm
            </div>
          </div>

          {/* 3. Chennai Port */}
          <div
            onClick={() => handleSelect(hotspots[2])}
            style={{ left: "78%", top: "45%" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-9 w-9 rounded-full bg-amber-500/30 animate-ping" />
              <div className="relative h-5 w-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950">
                <AlertTriangle className="h-3 w-3" />
              </div>
            </div>
            <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg glass-card border-white/10 text-[10px] font-mono text-slate-300">
              Port Terminal: 184.2 µg/m³
            </div>
          </div>

          {/* 4. Anand Vihar */}
          <div
            onClick={() => handleSelect(hotspots[3])}
            style={{ left: "49%", top: "65%" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <div className="relative h-4 w-4 rounded-full bg-cyan-electric-500 border-2 border-white flex items-center justify-center text-slate-950">
                <Crosshair className="h-2.5 w-2.5" />
              </div>
            </div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg glass-card border-white/10 text-[10px] font-mono text-slate-300">
              Transit Hub: 94.2 ppb
            </div>
          </div>
        </div>

        {/* Selected Hotspot Detailed Floating Card */}
        {activeSpot && (
          <motion.div
            key={activeSpot.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 p-4 rounded-2xl glass-card border-crimson-neon-500/40 shadow-glow-crimson space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-crimson-neon-500/20 text-crimson-neon-300 border border-crimson-neon-500/40 text-[9px] font-mono font-bold">
                    {activeSpot.severity}
                  </span>
                  <h4 className="text-xs font-bold text-white">{activeSpot.title}</h4>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{activeSpot.sector}</div>
              </div>

              <div className="text-right font-mono">
                <div className="text-sm font-black text-white">{activeSpot.value}</div>
                <div className="text-[10px] font-bold text-crimson-neon-400">
                  {activeSpot.baselineExceedance}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
              <span className="flex items-center space-x-1">
                <Radio className="h-3 w-3 text-cyan-electric-400" />
                <span>Sensor: {activeSpot.detectedVia}</span>
              </span>
              <span className="text-violet-satellite-400">
                Sentinel-5P Pixel Swath SRID 4326
              </span>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-20 p-3.5 rounded-xl glass-card border-white/10 text-[11px] font-mono space-y-1.5 text-slate-300">
          <div className="font-bold text-white text-xs mb-1 uppercase tracking-wider">
            Layer Classification
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-6 rounded-full bg-crimson-neon-500 shadow-glow-crimson" />
            <span>Critical Industrial Plume (&gt;300% Exceedance)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-6 rounded-full bg-violet-satellite-500 shadow-glow-violet opacity-80" />
            <span>Sentinel-5P TROPOMI NO₂ Swath</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-6 rounded-full bg-emerald-cyber-500 shadow-glow-emerald" />
            <span>Transit Bus LoRaWAN Mobile Mesh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
