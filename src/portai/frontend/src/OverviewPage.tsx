// OverviewPage.tsx — Primary Maritime Command Center Dashboard View

import React, { useState } from "react";
import BerthGrid from "./BerthGrid";
import RecommendationsPanel from "./RecommendationsPanel";
import { CongestionData, NavPage, OptimizeData, PortData, RiskLabel } from "./types";
import { riskColor } from "./utils";

interface Props {
  portData: PortData | null;
  congestion: CongestionData | null;
  optimize: OptimizeData | null;
  loadingOpt: boolean;
  onOptimize: () => void;
  onNavigatePage: (page: NavPage) => void;
  onOpenInfoModal: (title: string, body: string) => void;
  onAuthorizeDispatch: () => void;
}

const TERMINAL_ALIASES: Record<string, { subtitle: string; note: string }> = {
  "1": { subtitle: "Pacific North", note: "Primary deep-water container terminal" },
  "2": { subtitle: "Central Basin", note: "Multi-purpose berths with high-speed STS" },
  "3": { subtitle: "South Channel", note: "Feeder & break-bulk cargo sector" },
  "T1": { subtitle: "Pacific North", note: "Primary deep-water container terminal" },
  "T2": { subtitle: "Central Basin", note: "Multi-purpose berths with high-speed STS" },
  "T3": { subtitle: "South Channel", note: "Feeder & break-bulk cargo sector" },
};

export default function OverviewPage({
  portData,
  congestion,
  optimize,
  loadingOpt,
  onOptimize,
  onNavigatePage,
  onOpenInfoModal,
  onAuthorizeDispatch,
}: Props) {
  const [showTelemetryDetails, setShowTelemetryDetails] = useState(false);

  const risk = congestion?.overall.risk_label ?? "LOW";
  const rc = riskColor(risk as RiskLabel);
  const rm = congestion?.raw_metrics;

  const totalBerths = portData?.berths ?? 16;
  const availableBerths = rm?.available_berths ?? 0;
  const activeBerthsCount = Math.max(0, totalBerths - availableBerths);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. QUIET BORDERLESS KPI STRIP ──────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
        {/* KPI 1 */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[#85A1AF] font-medium">
            Vessels In Port
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-sono text-3xl sm:text-4xl font-semibold text-white">
              {rm?.total_vessels_in_schedule ?? "—"}
            </span>
            <span className="font-sono text-xs text-brand-green font-medium tracking-wide bg-brand-green/10 px-1.5 py-0.5 rounded">
              +{rm?.incoming_next_8h ?? 0} ARRIVING
            </span>
          </div>
          <span className="font-sono text-[11px] text-[#678494] mt-1">
            Window 8H Incoming Horizon
          </span>
        </div>

        {/* KPI 2 */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[#85A1AF] font-medium">
            Berth Utilization
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-sono text-3xl sm:text-4xl font-semibold text-white">
              {rm?.berth_utilization_pct ?? "0"}%
            </span>
            <span
              className={`font-sono text-xs font-medium tracking-wide px-1.5 py-0.5 rounded ${
                (rm?.berth_utilization_pct ?? 0) >= 80
                  ? "text-brand-red bg-brand-red/10"
                  : "text-brand-green bg-brand-green/10"
              }`}
            >
              {(rm?.berth_utilization_pct ?? 0) >= 80 ? "HIGH LOAD" : "NOMINAL"}
            </span>
          </div>
          <span className="font-sono text-[11px] text-[#678494] mt-1">
            {activeBerthsCount} of {totalBerths} berths active
          </span>
        </div>

        {/* KPI 3 */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[#85A1AF] font-medium">
            Crane Utilization
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span
              className={`font-sono text-3xl sm:text-4xl font-semibold ${
                (rm?.crane_utilization_pct ?? 0) >= 90 ? "text-brand-red" : "text-white"
              }`}
            >
              {rm?.crane_utilization_pct ?? "0"}%
            </span>
            <span
              className={`font-sono text-xs font-medium tracking-wide px-1.5 py-0.5 rounded ${
                (rm?.crane_utilization_pct ?? 0) >= 90
                  ? "text-brand-red bg-brand-red/10"
                  : "text-brand-blue bg-brand-blue/10"
              }`}
            >
              {(rm?.crane_utilization_pct ?? 0) >= 90 ? "SATURATED" : "OPTIMAL"}
            </span>
          </div>
          <span className="font-sono text-[11px] text-[#678494] mt-1">
            {portData?.cranes ?? 28} STS online · {rm?.available_cranes ?? 0} buffer
          </span>
        </div>

        {/* KPI 4 */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[#85A1AF] font-medium">
            Anchorage Queue
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="font-sono text-3xl sm:text-4xl font-semibold text-white">
              {rm?.queue_estimate ?? "0"}
            </span>
            <span
              className={`font-sono text-xs font-medium tracking-wide px-1.5 py-0.5 rounded ${
                (rm?.queue_estimate ?? 0) > 0
                  ? "text-brand-red bg-brand-red/10"
                  : "text-brand-green bg-brand-green/10"
              }`}
            >
              {(rm?.queue_estimate ?? 0) > 0 ? "QUEUED" : "CLEAR"}
            </span>
          </div>
          <span className="font-sono text-[11px] text-[#678494] mt-1">
            Avg dwell: {optimize ? `${optimize.summary.avg_wait_after_h}h` : "4.8h"}
          </span>
        </div>
      </section>

      {/* ── 2. DOMINANT HERO: CRITICAL RISK & 72H HORIZON PANEL ────────── */}
      <section className="w-full bg-ocean-surface rounded-xl border border-ocean-border p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle ambient highlight */}
        <div
          className={`absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            risk === "CRITICAL" || risk === "HIGH" ? "bg-brand-red/10" : "bg-brand-cyan/10"
          }`}
        ></div>

        {/* Header badge & title */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ocean-border/60">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded font-sono text-xs font-bold uppercase tracking-wider ${rc.badgeBg}`}
            >
              {risk === "CRITICAL"
                ? "SEV-1 ACTIVE"
                : risk === "HIGH"
                ? "SEV-2 ELEVATED"
                : "NORMAL OPERATIONS"}
            </span>
            <span className="font-sono text-xs uppercase tracking-wider text-[#85A1AF]">
              PORT RISK TELEMETRY · {portData?.name ?? "HARBOR BASIN"}
            </span>
          </div>
          <span className="font-sono text-xs text-[#85A1AF]">
            Predictive 72H Horizon Ensemble
          </span>
        </div>

        {/* Core Stats & Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
          {/* Score & Risk Summary */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-baseline gap-3">
              <span className={`font-sono text-5xl sm:text-6xl font-bold tracking-tight ${rc.text}`}>
                {congestion?.overall.congestion_score ?? "—"}
              </span>
              <span className="font-sono text-lg text-[#85A1AF]">/ 100 Congestion Index</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mt-3">
              {risk === "CRITICAL" || risk === "HIGH"
                ? "Terminal 1 is operating near maximum capacity."
                : "Harbor operations are balanced across all terminals."}
            </h2>
            <p className="text-sm text-[#85A1AF] mt-1.5 leading-relaxed font-sans">
              Peak window:{" "}
              <strong className="text-white font-sono">
                {congestion?.overall.peak_window_start
                  ? `${new Date(congestion.overall.peak_window_start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} → ${new Date(congestion.overall.peak_window_end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} UTC`
                  : "19:05 → 03:05 UTC"}
              </strong>{" "}
              ·{" "}
              <strong className="text-brand-red font-sono">
                {rm?.queue_estimate ?? 5} vessels queued
              </strong>
              . Heavy STS crane demand creates demurrage exposure without dynamic rerouting.
            </p>
          </div>

          {/* Integrated 72H Horizontal Forecast Timeline */}
          <div className="lg:col-span-6 bg-ocean-elevated/70 border border-ocean-border/70 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 text-xs font-sono text-[#85A1AF]">
              <span>ARRIVAL VOLUME ENSEMBLE</span>
              <span className="text-brand-red font-semibold">
                {congestion?.forecast?.[1]
                  ? `Surge @ ${congestion.forecast[1].window}`
                  : "+242% Surge @ T+24H"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(congestion?.forecast ?? []).map((w) => {
                const isPeak = w.risk_label === "CRITICAL" || w.risk_label === "HIGH";
                const wrc = riskColor(w.risk_label);

                return (
                  <div
                    key={w.window}
                    className={`flex flex-col items-center justify-center p-3 rounded border text-center relative transition-all ${
                      isPeak
                        ? "bg-brand-red/15 border-brand-red/40"
                        : "bg-ocean-base/60 border-ocean-border"
                    }`}
                  >
                    {isPeak && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
                    )}
                    <span
                      className={`font-sono text-[11px] ${
                        isPeak ? "text-brand-red font-bold" : "text-[#85A1AF]"
                      }`}
                    >
                      {w.window}
                    </span>
                    <span
                      className={`font-sono text-2xl my-0.5 ${
                        isPeak ? "font-bold text-brand-red" : "font-semibold text-white"
                      }`}
                    >
                      {w.vessel_count}
                    </span>
                    <span
                      className={`font-sono text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${wrc.badgeBg}`}
                    >
                      {w.risk_label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hero Actions & Interactive Drawer Trigger */}
        <div className="pt-4 mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-ocean-border/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onOpenInfoModal(
                  "Risk Telemetry Analysis",
                  "Terminal 1 STS-04 hydraulic outage: Cable tension failure at 14:22 UTC. Scheduled repair: 03:45 UTC. Current queue includes 3 ultra-large container carriers. Without alternate berth allocation to Terminal 2, total demurrage exceeds $184,200."
                )
              }
              className="h-9 px-4 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors"
            >
              Understand Risk
            </button>
            <button
              onClick={onOptimize}
              className="h-9 px-4 rounded bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(40,215,209,0.2)]"
            >
              Run Optimization
            </button>
          </div>
          <button
            onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
            className="text-xs font-sono text-brand-cyan hover:text-brand-cyanHover flex items-center gap-1 group"
          >
            <span>
              {showTelemetryDetails
                ? "Hide risk telemetry details"
                : "View risk telemetry details"}
            </span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Expandable Risk Telemetry Drawer */}
        {showTelemetryDetails && (
          <div className="mt-4 pt-4 border-t border-ocean-border text-xs font-sono text-[#85A1AF] space-y-2 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                <span className="text-white block font-semibold">T1 STS-04 Outage</span>
                <span className="text-[11px]">
                  Hydraulic pressure loss at Pier A. ETA restoration: 03:45 UTC.
                </span>
              </div>
              <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                <span className="text-white block font-semibold">Demurrage Risk Exposure</span>
                <span className="text-brand-red text-[11px] font-bold">
                  $184,200 estimated if unmitigated.
                </span>
              </div>
              <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                <span className="text-white block font-semibold">Tidal Window Lock</span>
                <span className="text-brand-green text-[11px] font-bold">
                  +1.4m slack water at 17:15 UTC.
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. SIMPLIFIED TERMINAL OVERVIEW CARDS ─────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold">
            Terminal Sectors Overview
          </h3>
          <button
            onClick={() => onNavigatePage("terminals")}
            className="text-xs font-sono text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View All Sectors</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(congestion?.terminal_breakdown ?? []).map((t) => {
            const trc = riskColor(t.risk_label);
            const alias = TERMINAL_ALIASES[t.terminal] ?? {
              subtitle: "Active Sector",
              note: "Nominal discharge speed",
            };

            return (
              <div
                key={t.terminal}
                className={`bg-ocean-surface rounded-xl p-5 border ${
                  t.risk_label === "CRITICAL"
                    ? "border-brand-red/60 shadow-lg hover:border-brand-red"
                    : "border-ocean-border hover:border-ocean-borderLight"
                } flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-sono text-base font-bold text-white">
                        Terminal {t.terminal}
                      </span>
                      <span className="text-[11px] font-sono text-[#85A1AF]">
                        ({alias.subtitle})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-sono text-[11px] font-bold uppercase ${trc.badgeBg}`}
                    >
                      {t.risk_label}
                    </span>
                  </div>

                  {/* 3 Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-ocean-border/60 text-center font-sono">
                    <div>
                      <span className="text-xl font-bold text-white block">{t.vessel_count}</span>
                      <span className="text-[10px] text-[#85A1AF] uppercase">Vessels</span>
                    </div>
                    <div>
                      <span
                        className={`text-xl font-bold block ${
                          t.berth_utilization >= 85 ? "text-brand-red" : "text-white"
                        }`}
                      >
                        {t.berth_utilization}%
                      </span>
                      <span className="text-[10px] text-[#85A1AF] uppercase">Berth</span>
                    </div>
                    <div>
                      <span
                        className={`text-xl font-bold block ${
                          t.queue_estimate > 0 ? "text-brand-red" : "text-brand-green"
                        }`}
                      >
                        {t.queue_estimate}
                      </span>
                      <span className="text-[10px] text-[#85A1AF] uppercase">Queued</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-sono ${
                      t.risk_label === "CRITICAL" ? "text-brand-red" : "text-brand-cyan"
                    }`}
                  >
                    {alias.note}
                  </span>
                  <button
                    onClick={() => onNavigatePage("terminals")}
                    className="text-xs font-sono text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Terminal</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. RECOMMENDATIONS & TACTICAL BERTH GRID ─────────────────────── */}
      <div className="space-y-6">
        <RecommendationsPanel
          data={optimize}
          loading={loadingOpt}
          onOptimize={onOptimize}
          onAuthorizeDispatch={onAuthorizeDispatch}
        />

        {portData && (
          <section className="bg-ocean-surface rounded-xl border border-ocean-border p-6 shadow-xl">
            <BerthGrid
              berths={
                congestion?.terminal_breakdown
                  ? portData.berth_records.filter((b) =>
                      congestion.terminal_breakdown.some((t) => t.terminal === b.terminal)
                    )
                  : portData.berth_records
              }
            />
          </section>
        )}
      </div>
    </div>
  );
}
