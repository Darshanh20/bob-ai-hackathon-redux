// RecommendationsPanel.tsx — AI Optimization Impact & Actionable Dispatch Orders

import React, { useState } from "react";
import { OptimizeData } from "./types";

interface Props {
  data: OptimizeData | null;
  loading: boolean;
  onOptimize: () => void;
  onAuthorizeDispatch?: () => void;
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: {
    bg: "bg-brand-red/20",
    text: "text-brand-red",
    border: "border-brand-red/40",
  },
  high: {
    bg: "bg-orange-400/20",
    text: "text-orange-400",
    border: "border-orange-400/40",
  },
  normal: {
    bg: "bg-ocean-elevated",
    text: "text-[#85A1AF]",
    border: "border-ocean-border",
  },
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function RecommendationsPanel({
  data,
  loading,
  onOptimize,
  onAuthorizeDispatch,
}: Props) {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Map crane allocations by vessel_code for quick lookup
  const craneMap = new Map(
    (data?.crane_plan?.assignments ?? []).map((c) => [c.vessel_code, c])
  );

  const assignments = data?.berth_plan?.assignments ?? [];
  const visibleSteps = showAllSteps ? assignments : assignments.slice(0, 5);

  const handleAuthorize = () => {
    setDispatched(true);
    if (onAuthorizeDispatch) onAuthorizeDispatch();
  };

  return (
    <section className="bg-ocean-surface rounded-xl border border-ocean-border p-6 sm:p-7 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-ocean-border/60">
        <div>
          <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold block mb-1">
            RECOMMENDED DISPATCH DIRECTIVE
          </span>
          <h3 className="text-lg font-semibold text-white">
            AI Optimization Impact &amp; Berthing Plan
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="px-3 py-1 rounded bg-brand-green/15 text-brand-green font-sono text-xs font-bold tracking-wider">
              ↓ {data.summary.improvement_percent}% WAIT TIME REDUCTION
            </span>
          )}
          <button
            onClick={onOptimize}
            disabled={loading}
            className="h-9 px-4 rounded bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(40,215,209,0.2)] disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{loading ? "Optimizing…" : "Re-Optimize"}</span>
          </button>
        </div>
      </div>

      {/* Baseline / Unoptimized State */}
      {!data && !loading && (
        <div className="bg-ocean-elevated/70 border border-ocean-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-sono font-bold text-yellow-300 uppercase tracking-wider">
                Standard Baseline (FCFS Active)
              </span>
            </div>
            <span className="text-[10px] font-sono text-[#85A1AF]">
              First-Come, First-Served Dispatch
            </span>
          </div>

          <p className="text-xs text-[#D3E4EC] leading-relaxed">
            The harbor is currently executing a naive <strong>First-Come, First-Served</strong> queue.
            Urgent container vessels wait behind standard cargo, causing crane idle times and avoidable demurrage penalties.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sono">
            <div className="bg-ocean-base/80 p-3 rounded-lg border border-ocean-border">
              <span className="text-yellow-400 block font-bold mb-1">Queue Congestion</span>
              <span className="text-[#85A1AF] text-[11px]">Urgent cargo delayed behind standard carriers.</span>
            </div>
            <div className="bg-ocean-base/80 p-3 rounded-lg border border-ocean-border">
              <span className="text-brand-red block font-bold mb-1">Demurrage Risk</span>
              <span className="text-[#85A1AF] text-[11px]">Unmitigated bottleneck at primary berths.</span>
            </div>
            <div className="bg-ocean-base/80 p-3 rounded-lg border border-ocean-border">
              <span className="text-brand-cyan block font-bold mb-1">Sub-optimal Cranes</span>
              <span className="text-[#85A1AF] text-[11px]">Cranes are not grouped by TEU density.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOptimize}
              className="w-full py-3 px-4 rounded-lg bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(40,215,209,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Run AI Optimization to Resolve Bottlenecks</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-ocean-elevated/70 border border-ocean-border rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-brand-cyan/15 flex items-center justify-center text-brand-cyan">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <p className="font-sono text-sm font-semibold text-white">Computing Optimal Dispatch Directives…</p>
          <p className="font-sono text-xs text-[#85A1AF]">
            Solving CP-SAT constraints for multi-terminal berths, crane gangs, and cargo urgency
          </p>
        </div>
      )}

      {/* Optimized State */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Comparison & Key Directive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: High contrast wait time comparison */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-sono uppercase tracking-wider text-[#85A1AF]">
                Average Fleet Dwell Duration
              </span>

              {/* Baseline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-sono">
                  <span className="text-brand-red font-semibold">CURRENT / UNRESOLVED</span>
                  <span className="text-brand-red font-bold">{data.summary.avg_wait_before_h}h AVG WAIT</span>
                </div>
                <div className="w-full bg-ocean-base h-4 rounded overflow-hidden">
                  <div className="bg-brand-red/80 h-full rounded" style={{ width: "100%" }}></div>
                </div>
              </div>

              {/* Optimized */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-sono">
                  <span className="text-brand-green font-semibold">AI OPTIMIZED</span>
                  <span className="text-brand-green font-bold">
                    {data.summary.avg_wait_after_h}h AVG WAIT (-{Math.max(0, data.summary.avg_wait_before_h - data.summary.avg_wait_after_h).toFixed(2)}h)
                  </span>
                </div>
                <div className="w-full bg-ocean-base h-4 rounded overflow-hidden">
                  <div
                    className="bg-brand-green h-full rounded"
                    style={{ width: `${Math.max(15, 100 - data.summary.improvement_percent)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right: Key Actionable Directive Card */}
            <div className="lg:col-span-6 bg-ocean-elevated/80 border border-ocean-border/80 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-sono text-brand-cyan font-semibold block mb-1">
                  KEY DIRECTIVE
                </span>
                <p className="text-sm font-medium text-white leading-relaxed">
                  {data.berth_plan.recommended_moves.length > 0 ? (
                    <>
                      PORTAI recommends rerouting{" "}
                      <strong className="text-brand-blue font-sono">
                        {data.berth_plan.recommended_moves[0].vessel_code}
                      </strong>{" "}
                      from <span className="text-brand-red line-through">{data.berth_plan.recommended_moves[0].from_terminal}</span> →{" "}
                      <strong className="text-brand-cyan font-sono">
                        {data.berth_plan.recommended_moves[0].assigned_berth}
                      </strong>{" "}
                      to bypass terminal bottleneck.
                    </>
                  ) : (
                    <>
                      All <strong className="text-brand-cyan font-sono">{data.summary.vessels_assigned} vessels</strong> allocated to optimal high-throughput berth slots with zero queue conflicts.
                    </>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-sono">
                  <span className="text-[#85A1AF]">ESTIMATED VALUE:</span>
                  <span className="text-brand-green font-bold text-sm">
                    ${(data.summary.conflicts_resolved * 19000 + data.summary.recommended_moves * 38000).toLocaleString() || "45,000"} saved in demurrage
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-ocean-border/60">
                <button
                  onClick={() => setShowAllSteps(!showAllSteps)}
                  className="h-8 px-3 rounded bg-ocean-surface hover:bg-ocean-border text-white text-xs font-sono font-medium border border-ocean-border transition-colors"
                >
                  {showAllSteps ? "Collapse Steps" : "Review All Steps"}
                </button>
                <button
                  onClick={handleAuthorize}
                  className={`h-8 px-4 rounded text-xs font-sono font-bold uppercase tracking-wider transition-all ${
                    dispatched
                      ? "bg-brand-green text-ocean-base shadow-[0_0_12px_rgba(53,211,154,0.3)]"
                      : "bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base shadow-[0_0_12px_rgba(40,215,209,0.2)]"
                  }`}
                >
                  {dispatched ? "✓ Dispatch Confirmed" : "Authorize Dispatch"}
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Action Plan */}
          {assignments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-brand-cyan">format_list_bulleted</span>
                  <span>Tactical Action Sequence ({assignments.length} Steps)</span>
                </div>
                {assignments.length > 5 && (
                  <button
                    onClick={() => setShowAllSteps(!showAllSteps)}
                    className="text-xs font-sono text-brand-cyan hover:underline font-semibold"
                  >
                    {showAllSteps ? "Show First 5 ↑" : `Show All ${assignments.length} Steps ↓`}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {visibleSteps.map((a, i) => {
                  const cranesInfo = craneMap.get(a.vessel_code);
                  const pBadge = PRIORITY_BADGES[a.priority] ?? PRIORITY_BADGES.normal;

                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg bg-ocean-base/80 border border-ocean-border/80 flex flex-col gap-2 hover:border-ocean-borderLight transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-ocean-elevated border border-ocean-border font-sono text-[11px] text-[#D3E4EC] px-2 py-0.5 rounded">
                            {formatDate(a.scheduled_start)} {formatTime(a.scheduled_start)}
                          </span>
                          <span className="font-sono font-bold text-sm text-white">
                            {a.vessel_code}
                          </span>
                          <span
                            className={`text-[10px] font-sono font-bold uppercase px-2 py-0.5 rounded border ${pBadge.bg} ${pBadge.text} ${pBadge.border}`}
                          >
                            {a.priority}
                          </span>
                        </div>

                        {a.is_terminal_move ? (
                          <span className="text-[11px] font-sono font-semibold text-yellow-300 bg-yellow-950/60 border border-yellow-600/60 px-2.5 py-0.5 rounded flex items-center gap-1">
                            <span>🔄</span>
                            <span>Rerouted {a.home_terminal} → {a.dest_terminal}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-sono text-[#85A1AF]">
                            Terminal {a.dest_terminal}
                          </span>
                        )}
                      </div>

                      {/* Operational Directive Row */}
                      <div className="text-xs text-[#D3E4EC] flex flex-wrap items-center gap-2 pt-1 border-t border-ocean-border/40 font-sono">
                        <span className="text-brand-cyan font-bold">DIRECTIVE:</span>
                        <span>Berth at</span>
                        <span className="text-brand-cyan font-bold px-2 py-0.5 rounded bg-ocean-elevated border border-ocean-border">
                          {a.berth_code}
                        </span>
                        <span className="text-[#678494]">·</span>
                        <span className="text-white">
                          {cranesInfo ? `${cranesInfo.cranes_assigned} STS Cranes` : "Assigned Cranes"}
                        </span>
                        {cranesInfo && (
                          <span className="text-[11px] text-[#85A1AF]">
                            ({cranesInfo.crane_codes.join(", ")})
                          </span>
                        )}
                        <span className="text-[#678494]">·</span>
                        <span className="text-[#85A1AF]">
                          {a.containers.toLocaleString()} TEU (~{a.service_hours}h service)
                        </span>
                        {a.wait_hours > 0 && (
                          <span className="text-yellow-400 text-[11px]">
                            (Wait: {a.wait_hours}h)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Crane Allocations per Terminal */}
          <div className="space-y-2 pt-2 border-t border-ocean-border/60">
            <span className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold block">
              Crane Gang Utilization per Terminal
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.crane_plan.terminal_summaries.map((t) => (
                <div key={t.terminal} className="bg-ocean-elevated/70 p-3 rounded-lg border border-ocean-border/70 space-y-1.5 font-sono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">Terminal {t.terminal}</span>
                    <span className="text-brand-cyan font-bold">{t.utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-ocean-base h-2 rounded overflow-hidden">
                    <div
                      className="bg-brand-cyan h-full rounded"
                      style={{ width: `${t.utilization_pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#85A1AF]">
                    <span>{t.cranes_allocated} of {t.available_cranes} STS active</span>
                    <span>{t.vessels_served} vessels</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
