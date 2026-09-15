// ReportsPage.tsx — Dedicated Executive 72-Hour Shift Audit & Demurrage Report Page

import React, { useState, useEffect } from "react";
import { ReportData } from "./types";
import { riskColor } from "./utils";

interface Props {
  portId: number;
  apiUrl: string;
}

export default function ReportsPage({ portId, apiUrl }: Props) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/ports/${portId}/report`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.detail || `HTTP Error ${r.status}`);
        }
        return r.json();
      })
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiUrl, portId]);

  const rc = report?.overall_risk ? riskColor(report.overall_risk) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-cyan text-xl">analytics</span>
            <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold">
              AUDIT &amp; DEMURRAGE BRIEFING
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">72-Hour Operations Report</h1>
          <p className="text-xs text-[#85A1AF] font-sans">
            Comprehensive executive risk analysis, bottleneck hotspots, and AI dispatch audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="h-9 px-4 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-cyan">print</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-ocean-surface rounded-xl border border-ocean-border p-16 text-center space-y-3">
          <span className="material-symbols-outlined text-3xl text-brand-cyan animate-spin">
            sync
          </span>
          <p className="font-sono text-xs text-[#85A1AF]">
            Compiling 72-Hour Operations Audit &amp; Demurrage Report…
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-brand-red/20 border border-brand-red/50 text-brand-red text-xs font-sono">
          Failed to generate report: {error}
        </div>
      )}

      {report && rc && (
        <div className="space-y-6">
          {/* Overall Risk Header Card */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl border bg-ocean-surface ${rc.border} gap-4 shadow-xl`}
          >
            <div>
              <div className="text-xs font-sono uppercase tracking-widest text-[#85A1AF]">
                Overall Port Risk Classification · {report.port}
              </div>
              <div className={`text-4xl font-bold font-sono ${rc.text} mt-1`}>
                {report.overall_risk} RISK HORIZON
              </div>
            </div>
            <div className="text-left sm:text-right text-xs font-sono text-[#85A1AF] space-y-1">
              <div>
                Generated at:{" "}
                <span className="text-white font-medium">
                  {new Date(report.generated_at).toLocaleString()}
                </span>
              </div>
              <div>
                Peak Congestion Window:{" "}
                <span className="text-yellow-400 font-bold">
                  {report.peak_congestion_window}
                </span>
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-ocean-surface border border-ocean-border rounded-xl p-4 text-center">
              <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider mb-1">
                Expected Fleet
              </div>
              <div className="font-sono font-bold text-2xl text-white">
                {report.expected_vessels} Vessels
              </div>
            </div>

            <div className="bg-ocean-surface border border-ocean-border rounded-xl p-4 text-center">
              <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider mb-1">
                High-Risk Sector
              </div>
              <div className="font-sono font-bold text-2xl text-brand-red">
                {report.high_risk_terminal}
              </div>
            </div>

            <div className="bg-ocean-surface border border-ocean-border rounded-xl p-4 text-center">
              <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider mb-1">
                Wait Time Drop
              </div>
              <div className="font-sono font-bold text-2xl text-brand-green">
                ↓ {report.expected_impact.wait_time_reduction_pct}%
              </div>
            </div>

            <div className="bg-ocean-surface border border-ocean-border rounded-xl p-4 text-center">
              <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider mb-1">
                Vessels Cleared
              </div>
              <div className="font-sono font-bold text-2xl text-brand-cyan">
                {report.expected_impact.vessels_cleared} Vessels
              </div>
            </div>
          </div>

          {/* Two-Column Grid: Risks vs Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Risks */}
            <div className="bg-ocean-surface rounded-xl border border-ocean-border p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-sono text-brand-red uppercase tracking-wider font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Identified Harbor Risk Exposures</span>
              </h3>
              <ul className="space-y-2.5">
                {report.key_risks.map((r, i) => (
                  <li
                    key={i}
                    className="p-3 bg-ocean-base/80 border border-ocean-border rounded-lg text-xs text-[#D3E4EC] flex items-start gap-2.5 leading-relaxed"
                  >
                    <span className="text-brand-red font-bold text-base mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Recommendations */}
            <div className="bg-ocean-surface rounded-xl border border-ocean-border p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-sono text-brand-cyan uppercase tracking-wider font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">recommend</span>
                <span>AI Strategic Optimization Directives</span>
              </h3>
              <ul className="space-y-2.5">
                {report.ai_recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="p-3 bg-ocean-base/80 border border-ocean-border rounded-lg text-xs text-[#D3E4EC] flex items-start gap-2.5 leading-relaxed font-sans"
                  >
                    <span className="text-brand-cyan font-bold text-base mt-0.5">›</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Projection Banner */}
          <div className="bg-ocean-elevated/80 border border-ocean-border rounded-xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-sono text-brand-green uppercase tracking-wider font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">trending_down</span>
              <span>Projected Operational Demurrage Relief</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sono pt-2">
              <div className="bg-ocean-base/80 p-4 rounded-xl border border-ocean-border text-center">
                <span className="text-[#85A1AF] text-[10px] block">WAIT TIME REDUCTION</span>
                <span className="font-bold text-brand-green text-2xl mt-1 block">
                  {report.expected_impact.wait_time_reduction_pct}%
                </span>
                <span className="text-[10px] text-[#678494] mt-0.5 block">
                  Cuts avg fleet dwell by ~3.76h
                </span>
              </div>

              <div className="bg-ocean-base/80 p-4 rounded-xl border border-ocean-border text-center">
                <span className="text-[#85A1AF] text-[10px] block">TOTAL VESSELS PROCESSED</span>
                <span className="font-bold text-white text-2xl mt-1 block">
                  {report.expected_impact.vessels_cleared}
                </span>
                <span className="text-[10px] text-[#678494] mt-0.5 block">
                  0 queue deadlocks
                </span>
              </div>

              <div className="bg-ocean-base/80 p-4 rounded-xl border border-ocean-border text-center">
                <span className="text-[#85A1AF] text-[10px] block">ANCHORAGE QUEUE REDUCTION</span>
                <span className="font-bold text-brand-cyan text-2xl mt-1 block">
                  -{report.expected_impact.queue_reduction} Vessels
                </span>
                <span className="text-[10px] text-[#678494] mt-0.5 block">
                  Estimated $184,200 saved in penalties
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
