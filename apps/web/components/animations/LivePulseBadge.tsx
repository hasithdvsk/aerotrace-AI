"use client";

import React from "react";
import { motion } from "framer-motion";

export interface LivePulseBadgeProps {
  statusText?: string;
  color?: "emerald" | "amber" | "rose" | "cyan" | "purple";
  pulseSpeed?: number; // seconds
  size?: "sm" | "md" | "lg";
  className?: string;
  pingCount?: number;
}

const COLOR_MAP = {
  emerald: {
    dot: "bg-emerald-400",
    ring: "border-emerald-400/80 bg-emerald-500/20",
    badge: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-emerald-950/40",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
  },
  amber: {
    dot: "bg-amber-400",
    ring: "border-amber-400/80 bg-amber-500/20",
    badge: "bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-amber-950/40",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
  },
  rose: {
    dot: "bg-rose-400",
    ring: "border-rose-400/80 bg-rose-500/20",
    badge: "bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-rose-950/40",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.5)]",
  },
  cyan: {
    dot: "bg-cyan-400",
    ring: "border-cyan-400/80 bg-cyan-500/20",
    badge: "bg-cyan-950/70 text-cyan-300 border-cyan-700/60 shadow-cyan-950/40",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.5)]",
  },
  purple: {
    dot: "bg-purple-400",
    ring: "border-purple-400/80 bg-purple-500/20",
    badge: "bg-purple-950/70 text-purple-300 border-purple-700/60 shadow-purple-950/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.5)]",
  },
};

export default function LivePulseBadge({
  statusText = "LIVE LORAWAN TELEMETRY",
  color = "emerald",
  pulseSpeed = 2.0,
  size = "md",
  className = "",
}: LivePulseBadgeProps) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] space-x-1.5",
    md: "px-2.5 py-1 text-xs space-x-2",
    lg: "px-3 py-1.5 text-sm space-x-2.5",
  }[size];

  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border backdrop-blur-md font-mono tracking-wider font-semibold shadow-lg transition-all ${c.badge} ${sizeClasses} ${className}`}
    >
      {/* Concentric Radar Pulse Rings */}
      <div className="relative flex items-center justify-center">
        {/* Outer Expanding Wave 1 */}
        <motion.span
          className={`absolute rounded-full border ${c.ring}`}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{
            duration: pulseSpeed,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Outer Expanding Wave 2 (Phase Offset) */}
        <motion.span
          className={`absolute rounded-full border ${c.ring}`}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{
            duration: pulseSpeed,
            repeat: Infinity,
            delay: pulseSpeed * 0.45,
            ease: "easeOut",
          }}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Central Core Pulsing Dot */}
        <motion.span
          className={`relative rounded-full ${c.dot} ${dotSize} ${c.glow}`}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: pulseSpeed * 0.75,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Label Text */}
      <span className="uppercase">{statusText}</span>
    </div>
  );
}
