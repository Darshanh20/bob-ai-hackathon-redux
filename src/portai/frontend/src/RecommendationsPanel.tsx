// RecommendationsPanel.tsx — AI optimiser recommendations & actionable dispatch orders

import React, { useState } from "react";
import { OptimizeData } from "./types";

interface Props {
  data: OptimizeData | null;
  loading: boolean;
  onOptimize: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400",
  high:   "text-orange-400",
  normal: "text-slate-300",
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

export default function RecommendationsPanel({ data, loading, onOptimize }: Props) {
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Map crane allocations by vessel_code for quick lookup
  const craneMap = new Map(
    (data?.crane_plan?.assignments ?? []).map((c) => [c.vessel_code, c])
  );

  const assignments = data?.berth_plan?.assignments ?? [];
  const visibleSteps = showAllSteps ? assignments : assignments.slice(0, 5);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            AI Recommendations & Dispatch Orders
          </h2>
          <p className="text-[11px] text-slate-500">
            Actionable berthing steps & crane allocations derived from live optimization
          </p>
        </div>
        <button
          onClick={onOptimize}
          disabled={loading}
          className="px-3 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shrink-0"
        >
          {loading ? "Running…" : "Optimize"}
        </button>
      </div>

      {!data && !loading && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Standard Baseline (Unoptimized)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Arrival Order (FCFS)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The harbor is currently operating on a raw <strong>First-Come, First-Served</strong> schedule. 
            Vessels dock strictly in arrival order without priority scheduling, dynamic crane allocation, 
            or alternate terminal routing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
              <span className="text-amber-400 block font-bold mb-0.5">High Delays</span>
              Urgent cargo queues behind standard vessels.
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
              <span className="text-amber-400 block font-bold mb-0.5">Terminal Bottlenecks</span>
              No alternate routing to balance harbor traffic.
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
              <span className="text-amber-400 block font-bold mb-0.5">Cranes Idle</span>
              Cranes are not dynamically grouped for heavy TEU ships.
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={onOptimize}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ Run AI Optimization to Resolve Bottlenecks</span>
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-8 text-center space-y-2">
          <div className="text-2xl animate-spin inline-block">⚙️</div>
          <p className="text-xs font-semibold text-slate-300">Computing Optimal Dispatch Plan…</p>
          <p className="text-[11px] text-slate-500">
            Balancing berth capacities, allocating dedicated cranes, and calculating alternate routes
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Improvement banner */}
          <div className="bg-indigo-900/40 border border-indigo-700 rounded px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-indigo-300">Expected waiting time reduction</span>
            <span className="font-mono text-lg font-bold text-indigo-400">
              {data.summary.improvement_percent}%
            </span>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900 rounded p-2">
              <div className="text-slate-500 mb-0.5">Avg wait BEFORE</div>
              <div className="font-mono text-slate-200">{data.summary.avg_wait_before_h} h</div>
            </div>
            <div className="bg-slate-900 rounded p-2">
              <div className="text-slate-500 mb-0.5">Avg wait AFTER</div>
              <div className="font-mono text-emerald-400">{data.summary.avg_wait_after_h} h</div>
            </div>
          </div>

          {/* Step-by-Step Action Plan (Dispatch Orders) */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  📋 Dispatch Action Plan ({assignments.length} steps)
                </div>
                {assignments.length > 5 && (
                  <button
                    onClick={() => setShowAllSteps(!showAllSteps)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    {showAllSteps ? "Show First 5 ↑" : `Show All ${assignments.length} Steps ↓`}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {visibleSteps.map((a, i) => {
                  const cranesInfo = craneMap.get(a.vessel_code);
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/70 flex flex-col gap-1.5 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 px-1.5 py-0.5 rounded">
                            {formatDate(a.scheduled_start)} {formatTime(a.scheduled_start)}
                          </span>
                          <span className="font-mono font-bold text-xs text-white">
                            {a.vessel_code}
                          </span>
                          <span
                            className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              a.priority === "urgent"
                                ? "bg-red-900/60 text-red-300 border border-red-700"
                                : a.priority === "high"
                                ? "bg-orange-900/60 text-orange-300 border border-orange-700"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {a.priority}
                          </span>
                        </div>

                        {a.is_terminal_move ? (
                          <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/70 border border-amber-600/70 px-2 py-0.5 rounded">
                            🔄 Rerouted {a.home_terminal} → {a.dest_terminal}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            Terminal {a.dest_terminal}
                          </span>
                        )}
                      </div>

                      {/* Direct Operational Instruction */}
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                        <span className="text-indigo-400 font-semibold">👉 Step:</span>
                        <span>Send to</span>
                        <span className="text-emerald-400 font-bold font-mono bg-emerald-950/50 border border-emerald-800 px-1.5 py-0.5 rounded text-[11px]">
                          Berth {a.berth_code}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300 text-[11px] font-mono">
                          {cranesInfo ? `${cranesInfo.cranes_assigned} Cranes` : "Allocated Cranes"}
                        </span>
                        {cranesInfo && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({cranesInfo.crane_codes.join(", ")})
                          </span>
                        )}
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 text-[11px]">
                          {a.containers.toLocaleString()} TEU (~{a.service_hours}h work)
                        </span>
                        {a.wait_hours > 0 && (
                          <span className="text-amber-400 text-[10px] font-mono">
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

          {/* Terminal moves summary if any */}
          {data.berth_plan.recommended_moves.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Alternate Routing Summary
              </div>
              {data.berth_plan.recommended_moves.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono bg-slate-900 rounded px-2 py-1">
                  <span className={`font-semibold ${PRIORITY_COLOR[m.priority] ?? ""}`}>
                    [{m.priority.toUpperCase()[0]}]
                  </span>
                  <span className="text-slate-200 truncate flex-1">{m.vessel_code}</span>
                  <span className="text-slate-400">{m.from_terminal}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-emerald-400">{m.to_terminal}</span>
                  <span className="text-slate-500">({m.assigned_berth})</span>
                </div>
              ))}
            </div>
          )}

          {/* Crane utilisation per terminal */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Crane Allocation
            </div>
            {data.crane_plan.terminal_summaries.map((t) => (
              <div key={t.terminal} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-slate-400 w-5">{t.terminal}</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded"
                    style={{ width: `${t.utilization_pct}%` }}
                  />
                </div>
                <span className="font-mono text-slate-300 text-[10px] w-10 text-right">
                  {t.utilization_pct}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 pt-1">
            {data.summary.vessels_assigned} vessels assigned · {data.summary.conflicts_resolved} conflicts resolved
          </p>
        </>
      )}
    </div>
  );
}
