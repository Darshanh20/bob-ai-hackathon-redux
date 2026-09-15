// SimulationPage.tsx — Dedicated What-If Scenario Simulator Page

import React, { useState } from "react";
import { BerthRecord, CraneRecord, SimulateResult } from "./types";
import { riskColor } from "./utils";

interface Props {
  portId: number;
  apiUrl: string;
  berths: BerthRecord[];
  cranes: CraneRecord[];
}

type SimType = "berth_unavailable" | "crane_unavailable";

export default function SimulationPage({
  portId,
  apiUrl,
  berths,
  cranes,
}: Props) {
  const [simType, setSimType] = useState<SimType>("berth_unavailable");
  const [targetId, setTargetId] = useState<number>(0);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableAssets =
    simType === "berth_unavailable"
      ? berths.filter((b) => b.status === "available")
      : cranes.filter((c) => c.status === "available");

  const assetLabel = (a: BerthRecord | CraneRecord) =>
    "berth_code" in a
      ? `${a.berth_code} (${a.terminal}) · ${a.max_vessel_size} · ${a.capacity_teu} TEU`
      : `${a.crane_code} (${a.terminal}) · ${a.capacity_moves_per_hour} moves/h`;

  async function runSim() {
    if (!targetId) {
      setError("Please select a target asset first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/ports/${portId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: simType, target_id: targetId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const scoreDir = result
    ? result.delta.congestion_score > 0
      ? "text-brand-red"
      : result.delta.congestion_score < 0
      ? "text-brand-green"
      : "text-[#85A1AF]"
    : "";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-cyan text-xl">science</span>
            <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold">
              CONTINGENCY &amp; STRESS TESTING
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">What-If Incident Simulator</h1>
          <p className="text-xs text-[#85A1AF] font-sans">
            Simulate crane breakdowns, berth maintenance closures, and severe weather impacts in-memory
          </p>
        </div>
      </div>

      {/* Main Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Box */}
        <div className="lg:col-span-5 bg-ocean-surface p-6 rounded-xl border border-ocean-border shadow-xl space-y-5">
          <h2 className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold">
            1. Select Outage Scenario
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSimType("berth_unavailable");
                setTargetId(0);
                setResult(null);
              }}
              className={`py-3 px-3 rounded-lg text-xs font-sono font-bold tracking-wider uppercase border transition-all flex flex-col items-center justify-center gap-2 ${
                simType === "berth_unavailable"
                  ? "bg-brand-cyan text-ocean-base border-brand-cyan shadow-[0_0_16px_rgba(40,215,209,0.25)]"
                  : "bg-ocean-elevated text-[#85A1AF] border-ocean-border hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">dock</span>
              <span>Berth Outage</span>
            </button>

            <button
              onClick={() => {
                setSimType("crane_unavailable");
                setTargetId(0);
                setResult(null);
              }}
              className={`py-3 px-3 rounded-lg text-xs font-sono font-bold tracking-wider uppercase border transition-all flex flex-col items-center justify-center gap-2 ${
                simType === "crane_unavailable"
                  ? "bg-brand-cyan text-ocean-base border-brand-cyan shadow-[0_0_16px_rgba(40,215,209,0.25)]"
                  : "bg-ocean-elevated text-[#85A1AF] border-ocean-border hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
              <span>STS Crane Fault</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-sono text-[#85A1AF] uppercase tracking-wider font-semibold">
              2. Target {simType === "berth_unavailable" ? "Berth" : "Crane"} To Take Offline
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="w-full bg-ocean-base border border-ocean-border rounded-lg px-3 py-2.5 text-xs text-white font-sono focus:outline-none focus:border-brand-cyan transition-colors"
            >
              <option value={0}>-- Choose Active Asset --</option>
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {assetLabel(a)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-brand-red/20 border border-brand-red/50 rounded-lg text-xs font-sono text-brand-red flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={runSim}
            disabled={loading || !targetId}
            className="w-full py-3 rounded-lg bg-brand-cyan hover:bg-brand-cyanHover disabled:opacity-40 text-ocean-base font-sono text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(40,215,209,0.25)] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>{loading ? "Simulating Impact…" : "Run Simulation Engine"}</span>
          </button>
        </div>

        {/* Right: Telemetry Results */}
        <div className="lg:col-span-7 bg-ocean-surface p-6 rounded-xl border border-ocean-border shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-ocean-border/60">
            <h2 className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold">
              Simulation Telemetry &amp; Impact Analysis
            </h2>
            {result && (
              <span className="text-[10px] font-sono text-brand-green uppercase font-bold">
                ✓ SIMULATION CONVERGED
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="py-16 text-center text-[#85A1AF] font-sans space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#678494]">
                query_stats
              </span>
              <p className="text-sm font-semibold text-white">No Simulation Active</p>
              <p className="text-xs text-[#85A1AF] max-w-sm mx-auto">
                Select a berth or crane on the left and run the solver to evaluate bottleneck risk and vessel reassignments.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center text-[#85A1AF] font-sono space-y-3">
              <span className="material-symbols-outlined text-3xl text-brand-cyan animate-spin">
                sync
              </span>
              <p className="text-xs font-semibold text-white">Recomputing CP-SAT schedule in-memory…</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-lg bg-ocean-elevated border border-ocean-border text-xs text-[#D3E4EC] leading-relaxed font-sans">
                <span className="font-sono text-brand-cyan font-bold block mb-1">
                  EXECUTIVE IMPACT EVALUATION:
                </span>
                {result.impact_summary}
              </div>

              {/* Before / After Comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs font-sono">
                {(["before", "after"] as const).map((k) => {
                  const state = result[k];
                  const rc = riskColor(state.risk_label);
                  return (
                    <div
                      key={k}
                      className={`rounded-lg border p-3.5 bg-ocean-base/80 ${rc.border}`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${rc.text}`}>
                        {k.toUpperCase()} OUTAGE SCENARIO
                      </div>
                      <div className="space-y-1.5 font-sono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Congestion Score:</span>
                          <span className={`font-bold ${rc.text}`}>{state.congestion_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Risk Level:</span>
                          <span className={`font-bold ${rc.text}`}>{state.risk_label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Avg Dwell:</span>
                          <span className="text-white font-medium">{state.avg_wait_h}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Queue:</span>
                          <span className="text-white font-medium">{state.queue_estimate} Vessels</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delta KPI Tiles */}
              <div className="grid grid-cols-3 gap-3 text-xs font-sono">
                <div className="bg-ocean-elevated p-3 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Congestion Δ</div>
                  <div className={`font-bold text-lg mt-0.5 ${scoreDir}`}>
                    {result.delta.congestion_score > 0 ? "+" : ""}
                    {result.delta.congestion_score}
                  </div>
                </div>
                <div className="bg-ocean-elevated p-3 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Wait Δ</div>
                  <div
                    className={`font-bold text-lg mt-0.5 ${
                      result.delta.avg_wait_h > 0 ? "text-brand-red" : "text-brand-green"
                    }`}
                  >
                    {result.delta.avg_wait_h > 0 ? "+" : ""}
                    {result.delta.avg_wait_h}h
                  </div>
                </div>
                <div className="bg-ocean-elevated p-3 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Reassigned Carriers</div>
                  <div className="font-bold text-lg text-brand-blue mt-0.5">
                    {result.delta.vessels_reassigned}
                  </div>
                </div>
              </div>

              {/* Reassigned List */}
              {result.reassigned_vessels.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-sono text-[#85A1AF] uppercase tracking-wider block font-semibold">
                    Dynamic Reassignment Queue ({result.reassigned_vessels.length} Carriers)
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {result.reassigned_vessels.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs font-sono bg-ocean-base/90 border border-ocean-border rounded-lg p-2.5"
                      >
                        <span className="text-white font-bold">{v.vessel_code}</span>
                        <div className="flex items-center gap-2 text-[#85A1AF]">
                          <span className="line-through">{v.from_berth}</span>
                          <span className="text-brand-cyan">→</span>
                          <span className="text-brand-cyan font-bold">{v.to_berth}</span>
                        </div>
                        <span className="text-yellow-400 font-medium">{v.new_wait_hours}h wait</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
