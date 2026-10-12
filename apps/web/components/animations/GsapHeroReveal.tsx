"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bus,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Globe,
  Radio,
} from "lucide-react";
import Link from "next/link";
import LivePulseBadge from "./LivePulseBadge";

export default function GsapHeroReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const gridCellsRef = useRef<SVGGElement>(null);
  const stepLabelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ------------------------------------------------------------------------
      // Timeline A: Staggered Entrance on Mount
      // ------------------------------------------------------------------------
      const enterTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      enterTl
        .fromTo(
          ".gsap-hero-badge",
          { opacity: 0, y: -20, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 }
        )
        .fromTo(
          ".gsap-hero-title",
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=0.3"
        )
        .fromTo(
          ".gsap-hero-desc",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.4"
        )
        .fromTo(
          ".gsap-hero-cta",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          "-=0.3"
        )
        .fromTo(
          ".gsap-hero-kpi",
          { opacity: 0, scale: 0.9, y: 25 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.12 },
          "-=0.4"
        )
        .fromTo(
          ".gsap-hero-canvas-box",
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 1.0 },
          "-=0.6"
        );

      // ------------------------------------------------------------------------
      // Timeline B: Scroll-Pinned Morph Storyboard (Vector Route -> Spatial Heat Grid)
      // ------------------------------------------------------------------------
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 15%",
          end: "+=120%",
          pin: false, // Smooth inline scrub transition without hard viewport freezing
          scrub: 1.2,
        },
      });

      // 1. Draw 2D bus route vector path
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength() || 1000;
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        scrollTl.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 2,
          ease: "none",
        });
      }

      // 2. Illuminate Kriging Spatial Grid cells
      if (gridCellsRef.current) {
        const cells = gridCellsRef.current.querySelectorAll("rect");
        scrollTl.fromTo(
          cells,
          { opacity: 0, scale: 0.2, transformOrigin: "center" },
          {
            opacity: (i) => (i % 3 === 0 ? 0.85 : i % 2 === 0 ? 0.6 : 0.4),
            scale: 1,
            stagger: {
              grid: [6, 10],
              from: "center",
              amount: 1.5,
            },
            duration: 2.5,
            ease: "power2.out",
          },
          "-=1.0"
        );
      }

      // 3. Morph dynamic stage title
      scrollTl.to(
        stepLabelRef.current,
        {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            if (stepLabelRef.current) {
              stepLabelRef.current.innerText =
                "PHASE 2: ORDINARY KRIGING CONTINUOUS GEOSTATISTICAL INTERPOLATION (>95% R²)";
            }
          },
        },
        1.0
      );
      scrollTl.to(stepLabelRef.current, { opacity: 1, duration: 0.3 }, 1.3);

      scrollTl.to(
        stepLabelRef.current,
        {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            if (stepLabelRef.current) {
              stepLabelRef.current.innerText =
                "PHASE 3: HYPERLOCAL POSTGIS STREET EXPOSURE GRID READY FOR CITIZEN ROUTING";
            }
          },
        },
        2.5
      );
      scrollTl.to(stepLabelRef.current, { opacity: 1, duration: 0.3 }, 2.8);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full space-y-12">
      {/* Top Headline Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="gsap-hero-badge">
            <LivePulseBadge
              statusText="LIVE LORAWAN TRANSIT MESH ACTIVE"
              color="emerald"
              size="sm"
            />
          </div>
          <span className="gsap-hero-badge px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800 shadow-sm">
            ESA SENTINEL-5P TROPOMI FUSION
          </span>
          <span className="gsap-hero-badge px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-800 shadow-sm">
            UN SDG 11 &amp; 13 COMPLIANT
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="gsap-hero-title text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
          Climate Intelligence for{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Clean Air Urban Mobility
          </span>
        </h1>

        {/* Subtitle description */}
        <p className="gsap-hero-desc text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Transforming municipal transit bus fleets into high-density mobile air quality sensing meshes.
          Fusing satellite macro-data with real-time LoRaWAN telemetry to navigate citizens through the cleanest routes
          and detect localized industrial emission hotspots.
        </p>

        {/* Action CTAs */}
        <div className="gsap-hero-cta flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href="/citizen"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm flex items-center space-x-2.5 shadow-xl shadow-emerald-950/60 transition-all hover:scale-105 active:scale-95"
          >
            <span>Launch Citizen Clean Route</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm flex items-center space-x-2.5 shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Government Portal</span>
          </Link>
        </div>

        {/* Four Key Performance Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6">
          <div className="gsap-hero-kpi p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur text-left space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Mobile Fleet Cost</span>
              <span className="text-emerald-400 font-bold">-99.8%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">$68.50</div>
            <div className="text-[11px] text-slate-500">vs. $45,000 reference towers</div>
          </div>

          <div className="gsap-hero-kpi p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur text-left space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Kriging Accuracy</span>
              <span className="text-cyan-400 font-bold">R² ≥ 0.95</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">99.4%</div>
            <div className="text-[11px] text-slate-500">Cross-validation score</div>
          </div>

          <div className="gsap-hero-kpi p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur text-left space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>LSTM Projection</span>
              <span className="text-purple-400 font-bold">PyTorch</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">14 Days</div>
            <div className="text-[11px] text-slate-500">Spike &amp; heat island warning</div>
          </div>

          <div className="gsap-hero-kpi p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur text-left space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Clean Route Shield</span>
              <span className="text-emerald-400 font-bold">WHO Limit</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">-38.2%</div>
            <div className="text-[11px] text-slate-500">Harmful particulate inhalation</div>
          </div>
        </div>
      </div>

      {/* Storyboard Vector-to-Grid Morph Visualizer */}
      <div className="gsap-hero-canvas-box rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        {/* Visualizer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Spatial Telemetry Transformation Pipeline
              </div>
              <div className="text-[11px] font-mono text-cyan-400">
                <span ref={stepLabelRef}>
                  PHASE 1: 5-NODE TRANSIT BUS LORAWAN TELEMETRY MESH INGESTION (3S CYCLE)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SCROLL TO SCRUB GEOSTATISTICAL INTERPOLATION</span>
          </div>
        </div>

        {/* SVG Vector & Heat Grid Morph Canvas */}
        <div className="relative w-full h-[280px] sm:h-[360px] flex items-center justify-center">
          <svg
            viewBox="0 0 800 360"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Spatial Grid Wireframe */}
            <g opacity="0.15">
              {Array.from({ length: 9 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 40}
                  x2="800"
                  y2={i * 40}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
              {Array.from({ length: 17 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 50}
                  y1="0"
                  x2={i * 50}
                  y2="360"
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>

            {/* Illuminated Spatial Kriging Grid Cells (Animated via GSAP) */}
            <g ref={gridCellsRef}>
              {Array.from({ length: 6 }).map((_, row) =>
                Array.from({ length: 12 }).map((_, col) => {
                  const x = 70 + col * 55;
                  const y = 30 + row * 50;
                  const isSpike = (row === 2 && col === 8) || (row === 4 && col === 3);
                  const isClean = row === 1 && col === 4;
                  const color = isSpike
                    ? "#ef4444"
                    : isClean
                    ? "#10b981"
                    : col % 2 === 0
                    ? "#06b6d4"
                    : "#f59e0b";

                  return (
                    <rect
                      key={`cell-${row}-${col}`}
                      x={x}
                      y={y}
                      width="48"
                      height="42"
                      rx="8"
                      fill={color}
                      opacity="0"
                      filter="url(#glowFilter)"
                    />
                  );
                })
              )}
            </g>

            {/* Glowing Bus Route Vector Line */}
            <path
              ref={pathRef}
              d="M 60,180 C 140,80 230,280 340,160 S 520,60 620,220 S 720,140 760,180"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glowFilter)"
            />

            {/* Ground Node Waypoint Markers */}
            <circle cx="60" cy="180" r="7" fill="#10b981" />
            <circle cx="340" cy="160" r="7" fill="#06b6d4" />
            <circle cx="620" cy="220" r="7" fill="#f59e0b" />
            <circle cx="760" cy="180" r="7" fill="#10b981" />
          </svg>
        </div>
      </div>
    </div>
  );
}
