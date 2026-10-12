"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Navigation2,
  ShieldCheck,
  HeartPulse,
  Wind,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Building2,
  BarChart3,
  Activity,
  Layers,
  Leaf,
  Info,
} from "lucide-react";
import DosageTrackerCard from "@/components/DosageTrackerCard";
import type { RouteSelectionData } from "@/components/CleanestRouteMap";

// Dynamic client import for Mapbox GL JS to prevent SSR window reference errors
const CleanestRouteMap = dynamic(
  () => import("@/components/CleanestRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-slate-400 font-mono text-xs space-y-3 animate-pulse">
        <div className="p-3 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
          <Navigation2 className="h-6 w-6 animate-spin" />
        </div>
        <span>Initializing Mapbox GL JS Spatial Navigation & PostGIS Street Grid...</span>
      </div>
    ),
  }
);

export default function CitizenPortalPage() {
  // Selected route state updated in real-time by Mapbox CleanestRouteMap
  const [selectedRoute, setSelectedRoute] = useState<RouteSelectionData>({
    routeId: "route-eco-green",
    routeName: "Route 1: Eco-Shield Corridor (via Green Buffer)",
    isCleanest: true,
    pm25Average: 36.4,
    durationMinutes: 24,
    distanceKm: 11.2,
    cumulativeExposureScore: 184,
    exposureSavingsPercent: 38,
    peakAqi: 82,
  });

  // Reference dirtier standard route metrics for comparative dosage calculations
  const standardAlternative = {
    pm25Average: 78.5,
    durationMinutes: 20,
  };

  const handleRouteSelection = (routeData: RouteSelectionData) => {
    setSelectedRoute(routeData);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Citizen Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                AeroTrace Citizen Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                COMMUTER ECO-SHIELD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Clean Air Navigation & Real-Time Inhalation Dosage Tracker for urban pedestrians, cyclists, and transit commuters.
            </p>
          </div>
        </div>

        {/* Global Navigation Links */}
        <div className="flex items-center space-x-2.5">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Overview</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Government Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Citizen Application Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Commuter Status Ribbon */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <span>Active Commute: {selectedRoute.routeName}</span>
                {selectedRoute.isCleanest ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    CLEANEST ROUTE ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    STANDARD ROUTE ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-3 mt-0.5 font-mono">
                <span>Distance: {selectedRoute.distanceKm} km</span>
                <span>•</span>
                <span>Duration: {selectedRoute.durationMinutes} mins</span>
                <span>•</span>
                <span>Avg PM2.5: {selectedRoute.pm25Average} µg/m³</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedRoute.isCleanest && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-right">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">
                  Pollution Exposure Reduction
                </span>
                <span className="text-base font-extrabold text-emerald-300 font-mono">
                  -{selectedRoute.exposureSavingsPercent || 38}% Saved
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Map Navigation + Dosage Tracker Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: CleanestRouteMap Component (Col 1 to 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Interactive Mapbox GL JS Navigation</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  PostGIS <code className="text-cyan-300">street_aqi_grid</code> Integration
                </span>
              </div>

              {/* Mapbox Route Component passing dynamic selection callback */}
              <CleanestRouteMap onRouteSelect={handleRouteSelection} />
            </div>
          </div>

          {/* Right Column: Real-Time Dosage Tracker Card & Commuter Health Advisory (Col 8 to 12) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Dynamic Dosage Tracker Card Component */}
            <DosageTrackerCard
              pm25Concentration={selectedRoute.pm25Average}
              durationMinutes={selectedRoute.durationMinutes}
              isCleanRoute={selectedRoute.isCleanest}
              routeName={selectedRoute.routeName}
              standardPm25Concentration={standardAlternative.pm25Average}
              standardDurationMinutes={standardAlternative.durationMinutes}
            />

            {/* 2. Urban Air Quality & Protective Inhalation Advisory */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-white">
                <span className="flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Commuter Respiratory Defense System</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">ACTIVE PROTOCOL</span>
              </div>

              <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Alveolar Particulate Deposition:</strong> Choosing urban corridors through tree-lined buffers reduces fine particulate intake by up to 40% compared to highway central lanes.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Active Cycling & Walking Mode:</strong> Inhaling air during elevated aerobic exercise triples your minute ventilation rate (1.92 m³/h vs 0.54 m³/h in a car). Clean routing is especially critical for cyclists and runners.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-xs text-slate-500 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <Leaf className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">AeroTrace Citizen Portal</span>
            <span>• Hyperlocal Clean Air Navigation</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            Powered by Mapbox GL JS • PostGIS Spatial Grids • TimescaleDB Telemetry
          </div>
        </div>
      </footer>
    </div>
  );
}
