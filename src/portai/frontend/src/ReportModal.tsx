// ReportModal.tsx — Executive 72-Hour Operations & Audit Report Modal

import React, { useState } from "react";
import { ReportData } from "./types";
import { riskColor } from "./utils";

interface Props {
  portId: number;
  apiUrl: string;
  onClose: () => void;
}

export default function ReportModal({ portId, apiUrl, onClose }: Props) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-ocean-surface border border-ocean-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-border/80 bg-ocean-base/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-cyan text-xl">analytics</span>
            <div>
              <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider">
                72-Hour Shift Operations Audit
              </div>
              <h2 className="font-sono font-bold text-white text-base">
                PORTAI — {report?.port ?? "HARBOR COMMAND"}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-[#85A1AF] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && (
            <div className="py-12 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-brand-cyan animate-spin">
                sync
              </span>
              <p className="font-sono text-xs text-[#85A1AF]">Generating 72-Hour Audit &amp; Demurrage Report…</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-brand-red/20 border border-brand-red/50 text-brand-red text-xs font-sono">
              Report Generation Error: {error}
            </div>
          )}

          {report && rc && (
            <>
              {/* Overall Risk Header Card */}
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-ocean-base/80 ${rc.border} gap-3`}
              >
                <div>
                  <div className="text-[10px] font-sono uppercase tracking-widest text-[#85A1AF]">
                    Overall Port Risk Classification
                  </div>
                  <div className={`text-3xl font-bold font-sono ${rc.text} mt-0.5`}>
                    {report.overall_risk} RISK
                  </div>
                </div>
                <div className="text-left sm:text-right text-[11px] font-sono text-[#85A1AF] space-y-0.5">
                  <div>
                    Generated:{" "}
                    <span className="text-white font-medium">
                      {new Date(report.generated_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    Peak Window:{" "}
                    <span className="text-yellow-400 font-bold">
                      {report.peak_congestion_window}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Expected Vessels", value: report.expected_vessels, color: "text-white" },
                  { label: "High-Risk Sector", value: report.high_risk_terminal, color: "text-brand-red" },
                  {
                    label: "Wait Reduction",
                    value: `↓ ${report.expected_impact.wait_time_reduction_pct}%`,
                    color: "text-brand-green",
                  },
                  {
                    label: "Vessels Cleared",
                    value: report.expected_impact.vessels_cleared,
                    color: "text-brand-cyan",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-ocean-elevated/70 border border-ocean-border rounded-lg p-3 text-center"
                  >
                    <div className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider mb-1">
                      {kpi.label}
                    </div>
                    <div className={`font-sono font-bold text-lg ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Key Risks */}
              <section className="space-y-2">
                <h3 className="text-xs font-sono text-brand-red uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Identified Risk Exposure</span>
                </h3>
                <ul className="space-y-1.5 bg-ocean-base/60 border border-ocean-border rounded-lg p-3.5">
                  {report.key_risks.map((r, i) => (
                    <li key={i} className="text-xs text-[#D3E4EC] flex items-start gap-2 leading-relaxed">
                      <span className="text-brand-red font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* AI Recommendations */}
              <section className="space-y-2">
                <h3 className="text-xs font-sono text-brand-cyan uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">recommend</span>
                  <span>AI Operational Recommendations</span>
                </h3>
                <ul className="space-y-1.5 bg-ocean-base/60 border border-ocean-border rounded-lg p-3.5">
                  {report.ai_recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-[#D3E4EC] flex items-start gap-2 leading-relaxed font-sans">
                      <span className="text-brand-cyan font-bold mt-0.5">›</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Expected Impact */}
              <section className="bg-ocean-elevated/80 border border-ocean-border rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-sono text-brand-green uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">trending_down</span>
                  <span>Projected Value &amp; Congestion Relief</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-sono pt-1">
                  <div className="bg-ocean-base/60 p-2.5 rounded-lg border border-ocean-border">
                    <div className="text-[10px] text-[#85A1AF]">Wait Drop</div>
                    <div className="font-bold text-brand-green text-base mt-0.5">
                      {report.expected_impact.wait_time_reduction_pct}%
                    </div>
                  </div>
                  <div className="bg-ocean-base/60 p-2.5 rounded-lg border border-ocean-border">
                    <div className="text-[10px] text-[#85A1AF]">Cleared Ships</div>
                    <div className="font-bold text-white text-base mt-0.5">
                      {report.expected_impact.vessels_cleared}
                    </div>
                  </div>
                  <div className="bg-ocean-base/60 p-2.5 rounded-lg border border-ocean-border">
                    <div className="text-[10px] text-[#85A1AF]">Queue Relief</div>
                    <div className="font-bold text-brand-cyan text-base mt-0.5">
                      -{report.expected_impact.queue_reduction} vessels
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ocean-border bg-ocean-base/50 flex justify-between items-center shrink-0">
          <span className="text-[11px] font-sono text-[#678494]">
            Export compliant with Harbor Master Shift Briefings
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-xs font-sono font-semibold text-white border border-ocean-border transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
