"use client";

import React, { useState } from "react";
import {
  Award,
  Building2,
  Globe,
  Download,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export interface ReportCardProps {
  activeSdgTab?: "SDG11" | "SDG13";
  onTabChange?: (tab: "SDG11" | "SDG13") => void;
  onExportBrief?: () => void;
  className?: string;
}

/**
 * UN SDG 11 & SDG 13 Urban Compliance Report Card Widget
 *
 * Features:
 * - Structured as a strict 3-column sub-grid for responsive alignment within main layout
 * - Fixed badge wrapping on the SDG header buttons so badges never obscure headline text
 * - Comprehensive KPI summaries and indicator tracking for COP-31 & UNEP standards
 */
export default function ReportCard({
  activeSdgTab: controlledTab,
  onTabChange,
  onExportBrief,
  className = "",
}: ReportCardProps) {
  const [internalTab, setInternalTab] = useState<"SDG11" | "SDG13">("SDG11");
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleSelectTab = (tab: "SDG11" | "SDG13") => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  return (
    <section
      id="sdg-report"
      className={`glass-card border border-white/10 p-6 space-y-6 ${className}`}
    >
      {/* Header with Title and SDG Selector Switch */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-cyber-400 bg-emerald-cyber-500/10 px-3 py-1 rounded-full border border-emerald-cyber-500/30 font-mono flex-wrap">
            <Award className="h-3.5 w-3.5 text-emerald-cyber-400 flex-shrink-0" />
            <span>UNITED NATIONS 2030 SUSTAINABLE DEVELOPMENT AUDIT</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2 flex-wrap">
            <span>UN SDG 11 &amp; SDG 13 Urban Compliance Report Card</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Statutory audit metrics tracking city-level ambient particulate matter reduction and methane super-emitter mitigation targets under COP-31 &amp; UNEP urban standards.
          </p>
        </div>

        {/* SDG Selector Switch & PDF Export - wrapped cleanly to avoid obscuring headline */}
        <div className="flex items-center flex-wrap gap-2.5 flex-shrink-0">
          <div className="flex bg-obsidian-950/90 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleSelectTab("SDG11")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 font-mono whitespace-nowrap ${
                activeTab === "SDG11"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>SDG 11 (Air &amp; Cities)</span>
            </button>
            <button
              onClick={() => handleSelectTab("SDG13")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 font-mono whitespace-nowrap ${
                activeTab === "SDG13"
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span>SDG 13 (Climate Action)</span>
            </button>
          </div>

          {onExportBrief && (
            <button
              onClick={onExportBrief}
              className="px-3.5 py-2 rounded-xl glass-card border border-white/10 hover:border-cyan-electric-500/40 text-white text-xs font-semibold flex items-center space-x-1.5 transition font-mono whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-cyan-electric-400 flex-shrink-0" />
              <span>Export Audit Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: SDG 11 (Sustainable Cities and Communities) */}
      {activeTab === "SDG11" && (
        <div className="space-y-6">
          {/* Top Banner KPI Sub-Grid (Strict 3-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl glass-card border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-obsidian-950">
              <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Indicator 11.6.2</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                58.4 <span className="text-xs font-normal text-slate-400">µg/m³</span>
              </div>
              <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />
                <span>-19.8 µg/m³ vs 2024 Baseline</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">Population-weighted annual mean PM2.5</div>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">WHO PM2.5 Gap</div>
              <div className="text-2xl font-black text-amber-300 mt-1 font-mono">+289%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono truncate">National standard: 40 µg/m³</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">WHO Annual Cap: 15 µg/m³</div>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Clean Air Days (Q3)</div>
              <div className="text-2xl font-black text-emerald-cyber-400 mt-1 font-mono">
                62 / 90 <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
              <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                <span>+14 days compared to 2025</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">AQI &lt; 100 in residential zones</div>
            </div>
          </div>

          {/* Detailed Indicator Breakdown (Strict 3-Column Sub-Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">11.6.1 Waste &amp; Landfill Smog</span>
                <span className="font-mono text-amber-400 font-bold flex-shrink-0">81.2%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "81.2%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Remediation of bio-mining sites in Ghazipur reducing open fugitive flares.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">11.2.1 Clean Transit Access</span>
                <span className="font-mono text-emerald-cyber-400 font-bold flex-shrink-0">88.5%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-emerald-cyber-500 h-full rounded-full" style={{ width: "88.5%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Population within 500m of low-emission EV bus corridors &amp; metro lines.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">11.7.1 School &amp; Hospital Buffers</span>
                <span className="font-mono text-cyan-electric-400 font-bold flex-shrink-0">92.0%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-cyan-electric-500 h-full rounded-full" style={{ width: "92.0%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Enforced 300m low-speed zones around pediatric and eldercare health centers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SDG 13 (Climate Action & Methane Mitigation) */}
      {activeTab === "SDG13" && (
        <div className="space-y-6">
          {/* Top Banner KPI Sub-Grid (Strict 3-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl glass-card border border-teal-500/30 bg-gradient-to-br from-teal-950/30 to-obsidian-950">
              <div className="text-[11px] font-mono text-teal-400 uppercase tracking-wider">Methane Abatement</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">82.4%</div>
              <div className="text-xs text-emerald-cyber-400 mt-1 flex items-center space-x-1 font-mono">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                <span>+18.2% YoY Detection</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">Super-emitter leaks capped &lt; 2h</div>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Hotspot Response Speed</div>
              <div className="text-2xl font-black text-teal-300 mt-1 font-mono">
                1.8 <span className="text-xs font-normal text-slate-400">Hours</span>
              </div>
              <div className="text-xs text-emerald-cyber-400 mt-1 font-mono truncate">UNEP Standard: &lt; 24h</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Drone survey &amp; civic command dispatch</div>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GHG Net Reduction</div>
              <div className="text-2xl font-black text-emerald-cyber-400 mt-1 font-mono">-18.4%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono truncate">2026 Milestone on track (-25% by 2030)</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Sentinel-5P + ground mesh tracking</div>
            </div>
          </div>

          {/* Detailed Indicator Breakdown (Strict 3-Column Sub-Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">13.2.1 Tropospheric Flaring</span>
                <span className="font-mono text-teal-400 font-bold flex-shrink-0">94.1%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: "94.1%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                TropOMI orbital monitoring suppressing runaway fugitive methane leaks.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">13.3.1 Civic Early Warning</span>
                <span className="font-mono text-emerald-cyber-400 font-bold flex-shrink-0">96.8%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-emerald-cyber-500 h-full rounded-full" style={{ width: "96.8%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Alerts broadcast to hospital ICUs, schools, and transport fleets within 3 mins.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2">13.1.2 Fugitive Compliance</span>
                <span className="font-mono text-amber-400 font-bold flex-shrink-0">78.0%</span>
              </div>
              <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "78.0%" }} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Automated CPCB scrutiny for industrial units across major corridors.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
