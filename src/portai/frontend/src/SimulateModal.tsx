// SimulateModal.tsx — What-If Scenario Simulator with Ocean Command Center Theme

import React, { useState } from "react";
import { BerthRecord, CraneRecord, SimulateResult } from "./types";
import { riskColor } from "./utils";

interface Props {
  portId: number;
  apiUrl: string;
  berths: BerthRecord[];
  cranes: CraneRecord[];
  onClose: () => void;
}

type SimType = "berth_unavailable" | "crane_unavailable";

export default function SimulateModal({
  portId,
  apiUrl,
  berths,
  cranes,
  onClose,
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
      ? `${a.berth_code} (${a.terminal}) · ${a.max_vessel_size}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-ocean-surface border border-ocean-border rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-border/80 bg-ocean-base/50">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-cyan text-xl">science</span>
            <div>
              <h2 className="font-sono font-bold text-white text-base">What-If Incident Simulator</h2>
              <span className="text-[10px] font-sono text-[#85A1AF]">In-memory contingency stress testing</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#85A1AF] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Scenario Type Toggle */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-sono uppercase tracking-wider text-[#85A1AF] font-semibold block">
              Failure Scenario
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSimType("berth_unavailable");
                  setTargetId(0);
                  setResult(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-sono font-bold tracking-wider uppercase border transition-all flex items-center justify-center gap-1.5 ${
                  simType === "berth_unavailable"
                    ? "bg-brand-cyan text-ocean-base border-brand-cyan shadow-[0_0_12px_rgba(40,215,209,0.25)]"
                    : "bg-ocean-elevated text-[#85A1AF] border-ocean-border hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dock</span>
                <span>Berth Outage</span>
              </button>
              <button
                onClick={() => {
                  setSimType("crane_unavailable");
                  setTargetId(0);
                  setResult(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-sono font-bold tracking-wider uppercase border transition-all flex items-center justify-center gap-1.5 ${
                  simType === "crane_unavailable"
                    ? "bg-brand-cyan text-ocean-base border-brand-cyan shadow-[0_0_12px_rgba(40,215,209,0.25)]"
                    : "bg-ocean-elevated text-[#85A1AF] border-ocean-border hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                <span>STS Crane Fault</span>
              </button>
            </div>
          </div>

          {/* Asset Selector */}
          <div>
            <label className="block text-[11px] font-sono text-[#85A1AF] mb-1.5 uppercase tracking-wider font-semibold">
              Select Target {simType === "berth_unavailable" ? "Berth" : "Crane"} To Simulate Offline
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="w-full bg-ocean-base border border-ocean-border rounded-lg px-3 py-2.5 text-xs text-white font-sono focus:outline-none focus:border-brand-cyan transition-colors"
            >
              <option value={0}>-- Select Asset --</option>
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
            className="w-full py-2.5 rounded-lg bg-brand-cyan hover:bg-brand-cyanHover disabled:opacity-40 text-ocean-base font-sono text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(40,215,209,0.25)] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>{loading ? "Simulating Impact…" : "Execute Scenario Simulation"}</span>
          </button>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-ocean-border">
              <div className="p-3 rounded-lg bg-ocean-elevated border border-ocean-border text-xs text-[#D3E4EC] leading-relaxed font-sans">
                <span className="font-sono text-brand-cyan font-bold block mb-1">IMPACT EVALUATION</span>
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
                      className={`rounded-lg border p-3 bg-ocean-base/80 ${rc.border}`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${rc.text}`}>
                        {k.toUpperCase()} SCENARIO
                      </div>
                      <div className="space-y-1 font-sono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Score:</span>
                          <span className={`font-bold ${rc.text}`}>{state.congestion_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Risk:</span>
                          <span className={`font-bold ${rc.text}`}>{state.risk_label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Avg wait:</span>
                          <span className="text-white font-medium">{state.avg_wait_h}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#85A1AF]">Queue:</span>
                          <span className="text-white font-medium">{state.queue_estimate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delta Row */}
              <div className="grid grid-cols-3 gap-2 text-xs font-sono">
                <div className="bg-ocean-elevated p-2.5 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Score Δ</div>
                  <div className={`font-bold text-base mt-0.5 ${scoreDir}`}>
                    {result.delta.congestion_score > 0 ? "+" : ""}
                    {result.delta.congestion_score}
                  </div>
                </div>
                <div className="bg-ocean-elevated p-2.5 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Wait Δ</div>
                  <div
                    className={`font-bold text-base mt-0.5 ${
                      result.delta.avg_wait_h > 0 ? "text-brand-red" : "text-brand-green"
                    }`}
                  >
                    {result.delta.avg_wait_h > 0 ? "+" : ""}
                    {result.delta.avg_wait_h}h
                  </div>
                </div>
                <div className="bg-ocean-elevated p-2.5 rounded-lg border border-ocean-border text-center">
                  <div className="text-[10px] text-[#85A1AF]">Reassigned</div>
                  <div className="font-bold text-base text-brand-blue mt-0.5">
                    {result.delta.vessels_reassigned}
                  </div>
                </div>
              </div>

              {/* Reassigned Vessels List */}
              {result.reassigned_vessels.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider block font-semibold">
                    Dynamic Reassignment Queue ({result.reassigned_vessels.length} Carriers)
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {result.reassigned_vessels.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] font-sono bg-ocean-base/90 border border-ocean-border rounded px-2.5 py-1.5"
                      >
                        <span className="text-white font-bold">{v.vessel_code}</span>
                        <div className="flex items-center gap-1.5 text-[#85A1AF]">
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
