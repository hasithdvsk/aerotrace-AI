"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Wind,
  TrendingDown,
  Activity,
  Car,
  Bike,
  Footprints,
  Info,
  HeartPulse,
  Sparkles,
  Zap,
} from "lucide-react";
import AnimatedCounter from "./animations/AnimatedCounter";
import LivePulseBadge from "./animations/LivePulseBadge";

export interface DosageTrackerProps {
  pm25Concentration?: number; // µg/m³
  durationMinutes?: number; // minutes
  isCleanRoute?: boolean;
  routeName?: string;
  standardPm25Concentration?: number; // µg/m³ of dirtier alternative
  standardDurationMinutes?: number;
  className?: string;
}

// Inhalation rates in m³/min based on physical exertion
const INHALATION_RATES: Record<string, { label: string; rate: number; icon: any; desc: string }> = {
  driving: {
    label: "Vehicle / Transit",
    rate: 0.009, // 0.54 m³/hr
    icon: Car,
    desc: "Low physical exertion inside cabin",
  },
  walking: {
    label: "Walking",
    rate: 0.018, // 1.08 m³/hr
    icon: Footprints,
    desc: "Moderate exertion brisk walking",
  },
  cycling: {
    label: "Cycling",
    rate: 0.032, // 1.92 m³/hr
    icon: Bike,
    desc: "Elevated aerobic ventilation",
  },
};

// WHO 24h recommended average PM2.5 level is 15 µg/m³.
// For a typical 1-way commute budget, WHO recommends intake under 25 µg.
const WHO_COMMUTE_THRESHOLD_UG = 25.0;
const WHO_DAILY_MAX_UG = 225.0; // 15 µg/m³ * 15 m³/day

export default function DosageTrackerCard({
  pm25Concentration = 36.4,
  durationMinutes = 24,
  isCleanRoute = true,
  routeName = "Eco-Shield Green Corridor",
  standardPm25Concentration = 78.5,
  standardDurationMinutes = 20,
  className = "",
}: DosageTrackerProps) {
  const [commuteMode, setCommuteMode] = useState<"driving" | "walking" | "cycling">("walking");
  const [roundTrip, setRoundTrip] = useState<boolean>(true); // 2x for daily commute

  const activeMode = INHALATION_RATES[commuteMode];
  const tripMultiplier = roundTrip ? 2 : 1;

  // Formula: Dosage = PM2.5_Concentration * Inhalation_Rate * Duration
  // Units: (µg/m³) * (m³/min) * min = µg
  const airVolumeM3 = activeMode.rate * durationMinutes * tripMultiplier;
  const personalDosageUg = pm25Concentration * airVolumeM3;

  // Standard route comparison
  const standardAirVolumeM3 = activeMode.rate * standardDurationMinutes * tripMultiplier;
  const standardDosageUg = standardPm25Concentration * standardAirVolumeM3;

  // Savings
  const dosageSavedUg = Math.max(0, standardDosageUg - personalDosageUg);
  const dosageReductionPct =
    standardDosageUg > 0 ? Math.round((dosageSavedUg / standardDosageUg) * 100) : 0;

  // WHO Threshold calculation
  const whoBudget = roundTrip ? WHO_COMMUTE_THRESHOLD_UG * 2 : WHO_COMMUTE_THRESHOLD_UG;
  const whoPercentage = Math.round((personalDosageUg / whoBudget) * 100);

  // Risk stratification color
  const getRiskColor = (pct: number) => {
    if (pct <= 40) return { color: "emerald", label: "Safe / Optimal Shield", barClass: "bg-emerald-500 shadow-emerald-500/50" };
    if (pct <= 75) return { color: "amber", label: "Moderate Inhalation", barClass: "bg-amber-500 shadow-amber-500/50" };
    if (pct <= 100) return { color: "orange", label: "High Commute Burden", barClass: "bg-orange-500 shadow-orange-500/50" };
    return { color: "rose", label: "Exceeds WHO Allowance", barClass: "bg-rose-500 animate-pulse shadow-rose-500/50" };
  };

  const risk = getRiskColor(whoPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`glass-card glass-card-hover border border-white/10 p-6 space-y-6 text-slate-100 shadow-2xl backdrop-blur-2xl ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-cyber-500/15 border border-emerald-cyber-500/40 text-emerald-cyber-400 shadow-glow-emerald">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="text-gradient-emerald">Personal Pollution Dosage Tracker</span>
              {isCleanRoute && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-cyber-500/20 text-emerald-cyber-300 border border-emerald-cyber-500/40 font-mono font-bold shadow-glow-emerald">
                  CLEAN ROUTE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Formula: <code className="text-cyan-electric-400 font-mono">Dosage = PM2.5 × Inhalation_Rate × Duration</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Live Pulse Indicator */}
          <LivePulseBadge
            statusText={isCleanRoute ? "ACTIVE SHIELD" : "STANDARD CORRIDOR"}
            color={isCleanRoute ? "emerald" : "amber"}
            size="sm"
          />

          {/* Round trip toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setRoundTrip(!roundTrip)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition ${
              roundTrip
                ? "bg-slate-800 text-cyan-300 border-cyan-700/60"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            {roundTrip ? "Daily (Round-Trip 2x)" : "Single Trip (1x)"}
          </motion.button>
        </div>
      </div>

      {/* Transit Mode Selector */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex justify-between items-center">
          <span>Select Commuter Inhalation Activity</span>
          <span className="text-[10px] text-slate-500 font-normal">
            Ventilation: {(activeMode.rate * 60).toFixed(2)} m³/hr
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["walking", "cycling", "driving"] as const).map((mode) => {
            const config = INHALATION_RATES[mode];
            const Icon = config.icon;
            const isSelected = commuteMode === mode;
            return (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCommuteMode(mode)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 ${
                  isSelected
                    ? "bg-obsidian-800 border-emerald-cyber-400 text-white shadow-glow-emerald ring-1 ring-emerald-cyber-400/40"
                    : "bg-obsidian-950/70 border-white/10 text-slate-400 hover:border-emerald-cyber-500/30 hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected ? "bg-emerald-cyber-500/20 text-emerald-cyber-400" : "bg-obsidian-900 text-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">{config.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {(config.rate * 60).toFixed(2)} m³/h
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Dosage Metrics Display Card */}
      <div className="p-5 rounded-2xl glass-card border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Estimated Personal Intake
            </div>
            <div className="flex items-baseline space-x-2 mt-0.5 font-mono">
              <span className="text-3xl font-extrabold text-gradient-emerald tracking-tight flex items-baseline">
                <AnimatedCounter value={personalDosageUg} precision={1} />
              </span>
              <span className="text-xs text-slate-400">µg (micrograms)</span>
            </div>
          </div>

          {/* Compared to standard route savings */}
          {dosageSavedUg > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-right p-2.5 rounded-xl bg-emerald-cyber-500/10 border border-emerald-cyber-500/40 shadow-glow-emerald"
            >
              <div className="text-[10px] uppercase font-mono text-emerald-cyber-400 flex items-center justify-end space-x-1">
                <TrendingDown className="h-3 w-3" />
                <span>Protected Inhalation</span>
              </div>
              <div className="text-sm font-bold text-emerald-cyber-300 font-mono">
                -<AnimatedCounter value={dosageSavedUg} precision={1} /> µg (
                <AnimatedCounter value={dosageReductionPct} precision={0} />% less)
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic Risk Accumulation Progress Bar with Spring Animation */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <span>WHO Commute Guideline:</span>
              <strong className="text-white font-mono">{whoBudget} µg</strong>
            </span>
            <span
              className={`font-mono font-bold text-xs flex items-center space-x-1 ${
                whoPercentage <= 50 ? "text-emerald-cyber-400" : whoPercentage <= 100 ? "text-amber-400" : "text-crimson-neon-400"
              }`}
            >
              <AnimatedCounter value={whoPercentage} precision={0} />
              <span>% of limit ({risk.label})</span>
            </span>
          </div>

          <div className="relative w-full h-3 rounded-full bg-obsidian-950 overflow-hidden border border-white/10">
            {/* 100% Marker Line */}
            <div className="absolute top-0 bottom-0 left-full -ml-0.5 w-0.5 bg-crimson-neon-500/60 z-10" />

            {/* Spring-animated Gradient Filled Bar */}
            <motion.div
              className={`h-full rounded-full shadow-lg ${
                whoPercentage <= 50
                  ? "bg-gradient-to-r from-emerald-cyber-500 to-cyan-electric-400 shadow-glow-emerald"
                  : whoPercentage <= 100
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-crimson-neon-500 to-rose-600 shadow-glow-crimson"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(whoPercentage, 100)}%` }}
              transition={{
                type: "spring",
                stiffness: 75,
                damping: 18,
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
            <span>0 µg (Pristine)</span>
            <span>{whoBudget * 0.5} µg (50%)</span>
            <span className="text-crimson-neon-400">{whoBudget} µg (WHO Cap)</span>
          </div>
        </div>

        {/* Exposure Parameters Breakdown with Animated Spring Numbers */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/10">
            <div className="text-[10px] text-slate-500">Avg PM2.5</div>
            <div className="font-bold text-cyan-electric-400">
              <AnimatedCounter value={pm25Concentration} precision={1} suffix=" µg/m³" />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/10">
            <div className="text-[10px] text-slate-500">Air Inhaled</div>
            <div className="font-bold text-slate-200">
              <AnimatedCounter value={airVolumeM3} precision={2} suffix=" m³" />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-obsidian-950/80 border border-white/10">
            <div className="text-[10px] text-slate-500">Commute Time</div>
            <div className="font-bold text-slate-200">{durationMinutes * tripMultiplier} mins</div>
          </div>
        </div>
      </div>

      {/* Advisory Health Shield Tip */}
      <div className="p-3.5 rounded-xl glass-card border-white/10 flex items-start space-x-2.5 text-xs text-slate-300">
        <Sparkles className="h-4 w-4 text-emerald-cyber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-white">Health Protection Impact:</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isCleanRoute
              ? `Routing through the Eco-Shield Corridor prevents ${dosageSavedUg.toFixed(1)} µg of deep alveolar particulate deposition compared to standard highway transit.`
              : `High particulate inhalation detected along arterial corridors. Consider switching to the Eco-Shield Green Route to reduce dosage by ${dosageReductionPct}%.`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
