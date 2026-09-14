// SimulateModal.tsx — What-if scenario modal

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

export default function SimulateModal({ portId, apiUrl, berths, cranes, onClose }: Props) {
  const [simType, setSimType]     = useState<SimType>("berth_unavailable");
  const [targetId, setTargetId]   = useState<number>(0);
  const [result, setResult]       = useState<SimulateResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const availableAssets = simType === "berth_unavailable"
    ? berths.filter((b) => b.status === "available")
    : cranes.filter((c) => c.status === "available");

  const assetLabel = (a: BerthRecord | CraneRecord) =>
    "berth_code" in a ? `${a.berth_code} (${a.terminal})` : `${a.crane_code} (${a.terminal})`;

  async function runSim() {
    if (!targetId) { setError("Select a target asset first"); return; }
    setLoading(true); setError(null); setResult(null);
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
    ? result.delta.congestion_score > 0 ? "text-red-400" : result.delta.congestion_score < 0 ? "text-emerald-400" : "text-slate-400"
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white tracking-wide">What-If Simulator</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sim type toggle */}
          <div className="flex gap-2">
            {(["berth_unavailable", "crane_unavailable"] as SimType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setSimType(t); setTargetId(0); setResult(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  simType === t
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-400 hover:text-white"
                }`}
              >
                {t === "berth_unavailable" ? "Berth Offline" : "Crane Offline"}
              </button>
            ))}
          </div>

          {/* Asset selector */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 uppercase tracking-wider">
              Select {simType === "berth_unavailable" ? "Berth" : "Crane"}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>-- choose --</option>
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>{assetLabel(a)}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>}

          <button
            onClick={runSim}
            disabled={loading || !targetId}
            className="w-full py-2 text-sm font-semibold rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white transition-colors"
          >
            {loading ? "Simulating…" : "Run Simulation"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-1 border-t border-slate-700">
              <p className="text-[11px] text-slate-300 leading-relaxed">{result.impact_summary}</p>

              {/* Before / After comparison */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {(["before", "after"] as const).map((k) => {
                  const state = result[k];
                  const rc = riskColor(state.risk_label);
                  return (
                    <div key={k} className={`rounded-lg border p-3 ${rc.bg} ${rc.border}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${rc.text}`}>{k}</div>
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between"><span className="text-slate-400">Score</span><span className={rc.text}>{state.congestion_score}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Risk</span><span className={rc.text}>{state.risk_label}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Avg wait</span><span className="text-slate-200">{state.avg_wait_h}h</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Queue</span><span className="text-slate-200">{state.queue_estimate}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Berths</span><span className="text-slate-200">{state.available_berths}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delta row */}
              <div className="flex gap-3 text-[11px] font-mono">
                <div className="flex-1 bg-slate-800 rounded p-2 text-center">
                  <div className="text-slate-500 text-[10px]">Score Δ</div>
                  <div className={`font-bold text-base ${scoreDir}`}>
                    {result.delta.congestion_score > 0 ? "+" : ""}{result.delta.congestion_score}
                  </div>
                </div>
                <div className="flex-1 bg-slate-800 rounded p-2 text-center">
                  <div className="text-slate-500 text-[10px]">Wait Δ</div>
                  <div className={`font-bold text-base ${result.delta.avg_wait_h > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {result.delta.avg_wait_h > 0 ? "+" : ""}{result.delta.avg_wait_h}h
                  </div>
                </div>
                <div className="flex-1 bg-slate-800 rounded p-2 text-center">
                  <div className="text-slate-500 text-[10px]">Reassigned</div>
                  <div className="font-bold text-base text-orange-400">{result.delta.vessels_reassigned}</div>
                </div>
              </div>

              {/* Reassigned vessel list */}
              {result.reassigned_vessels.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reassigned Vessels</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {result.reassigned_vessels.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-mono bg-slate-800 rounded px-2 py-1">
                        <span className="text-slate-200 truncate flex-1">{v.vessel_code}</span>
                        <span className="text-slate-500">{v.from_berth}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-orange-400">{v.to_berth}</span>
                        <span className="text-slate-400">{v.new_wait_hours}h</span>
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
