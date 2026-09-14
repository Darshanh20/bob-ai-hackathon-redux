// App.tsx — PORTAI Operations Dashboard

import React, { useCallback, useEffect, useRef, useState } from "react";
import BerthGrid from "./BerthGrid";
import CopilotChat from "./CopilotChat";
import RecommendationsPanel from "./RecommendationsPanel";
import ReportModal from "./ReportModal";
import SimulateModal from "./SimulateModal";
import { CongestionData, OptimizeData, PortData, RiskLabel } from "./types";
import { riskColor } from "./utils";

const API_URL = process.env.REACT_APP_PUBLIC_API_URL ?? "http://localhost:8000";
const PORT_ID = 1;
const POLL_MS  = 30_000;

// ── Risk badge colours ────────────────────────────────────────────────────────
const RISK_BIG: Record<RiskLabel, string> = {
  LOW:      "bg-emerald-600/30 border-emerald-500 text-emerald-300",
  MEDIUM:   "bg-yellow-600/30  border-yellow-500  text-yellow-300",
  HIGH:     "bg-orange-600/30  border-orange-500  text-orange-300",
  CRITICAL: "bg-red-700/30     border-red-600     text-red-300",
};

// ── Forecast dot ──────────────────────────────────────────────────────────────
function RiskDot({ label }: { label: RiskLabel }) {
  const rc = riskColor(label);
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${rc.dot}`} />;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <span className="font-mono text-xl font-bold text-white leading-tight">
        {value}<span className="text-sm text-slate-400 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function App() {
  const [portData,     setPortData]     = useState<PortData | null>(null);
  const [congestion,   setCongestion]   = useState<CongestionData | null>(null);
  const [optimize,     setOptimize]     = useState<OptimizeData | null>(null);
  const [loadingOpt,   setLoadingOpt]   = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<string>("");
  const [error,        setError]        = useState<string | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [reseeding,    setReseeding]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchPort = useCallback(async () => {
    const res = await fetch(`${API_URL}/ports/${PORT_ID}`);
    if (!res.ok) throw new Error(`Port fetch failed: ${res.status}`);
    setPortData(await res.json());
  }, []);

  const fetchCongestion = useCallback(async () => {
    const res = await fetch(`${API_URL}/ports/${PORT_ID}/congestion`);
    if (!res.ok) throw new Error(`Congestion fetch failed: ${res.status}`);
    setCongestion(await res.json());
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const fetchOptimize = useCallback(async () => {
    setLoadingOpt(true);
    try {
      const res = await fetch(`${API_URL}/ports/${PORT_ID}/optimize`);
      if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
      setOptimize(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingOpt(false);
    }
  }, []);

  // ── Upload Schedule CSV ───────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/ports/${PORT_ID}/vessels/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      setToast(`Schedule updated! Imported ${data.vessels_imported} vessels across ${data.terminals_covered.length} terminals.`);
      setTimeout(() => setToast(null), 5000);
      await Promise.all([fetchPort(), fetchCongestion(), fetchOptimize()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Reset / Re-seed port ─────────────────────────────────────────────────
  const handleReseed = async () => {
    setReseeding(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ports/${PORT_ID}/reseed`, { method: "POST" });
      if (!res.ok) throw new Error(`Reseed failed: HTTP ${res.status}`);
      setToast("Port re-seeded with a fresh 72-hour realistic dataset!");
      setTimeout(() => setToast(null), 5000);
      await Promise.all([fetchPort(), fetchCongestion(), fetchOptimize()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReseeding(false);
    }
  };

  // ── Initial load + polling ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchPort(), fetchCongestion(), fetchOptimize()]).catch((e) =>
      setError(e.message)
    );
    timerRef.current = setInterval(() => {
      fetchCongestion().catch(() => {});
    }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const risk = congestion?.overall.risk_label ?? "LOW";
  const rc   = riskColor(risk as RiskLabel);
  const rm   = congestion?.raw_metrics;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-extrabold tracking-tight">
              PORT<span className="text-indigo-400">AI</span>
            </span>
            <span className="hidden sm:block text-slate-500 text-xs font-mono truncate max-w-[200px]">
              {portData?.name ?? "…"}
            </span>
          </div>

          {/* Stat tiles */}
          <div className="flex gap-2 flex-wrap flex-1">
            <StatTile label="Vessels"      value={rm?.total_vessels_in_schedule ?? "—"} />
            <StatTile label="Berth Util"   value={rm ? `${rm.berth_utilization_pct}` : "—"} unit="%" />
            <StatTile label="Crane Util"   value={rm ? `${rm.crane_utilization_pct}` : "—"} unit="%" />
            <StatTile label="Queue"        value={rm?.queue_estimate ?? "—"} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload vessel schedule CSV"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white transition-colors"
            >
              {uploading ? "Uploading…" : "↑ Upload CSV"}
            </button>
            <button
              onClick={handleReseed}
              disabled={reseeding}
              title="Reset with a fresh 72h demo schedule"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white transition-colors"
            >
              {reseeding ? "Resetting…" : "↺ Reset"}
            </button>
            <button
              onClick={fetchOptimize}
              disabled={loadingOpt}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
            >
              {loadingOpt ? "…" : "Optimize"}
            </button>
            <button
              onClick={() => setShowSimulate(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-600 hover:bg-orange-500 text-white transition-colors"
            >
              Simulate
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              Report
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {toast && (
          <div className="bg-emerald-900/40 border border-emerald-600 rounded-lg px-4 py-2.5 text-xs text-emerald-200 flex justify-between items-center shadow-lg animate-fadeIn">
            <span>✓ {toast}</span>
            <button onClick={() => setToast(null)} className="ml-4 text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-xs text-red-300 flex justify-between items-center">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-200">✕</button>
          </div>
        )}

        {/* ── Congestion risk banner ──────────────────────────────────────── */}
        <section className={`rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4 ${RISK_BIG[risk as RiskLabel]}`}>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-black font-mono tracking-tight ${rc.text}`}>{risk}</div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-200">
                Congestion Score: <span className={`font-mono ${rc.text}`}>{congestion?.overall.congestion_score ?? "—"}</span>
                <span className="text-[11px] text-slate-400 ml-2">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Peak window: {congestion?.overall.peak_window_start
                  ? `${new Date(congestion.overall.peak_window_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(congestion.overall.peak_window_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "—"}
              </div>
              <div className="text-[10px] text-slate-500">Updated {lastUpdated || "…"} · polling every 30s</div>
            </div>
          </div>

          {/* 72-hour forecast strip */}
          <div className="flex gap-3">
            {(congestion?.forecast ?? []).map((w) => (
              <div key={w.window} className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-center min-w-[68px]">
                <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1">{w.window}</div>
                <div className="flex justify-center mb-1"><RiskDot label={w.risk_label as RiskLabel} /></div>
                <div className={`text-[11px] font-mono font-semibold ${riskColor(w.risk_label as RiskLabel).text}`}>
                  {w.risk_label}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{w.vessel_count}v</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Two-column layout: left=main content, right=copilot ─────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          {/* Left column */}
          <div className="space-y-5">

            {/* Terminal congestion breakdown */}
            {congestion?.terminal_breakdown && (
              <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  Terminal Breakdown
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {congestion.terminal_breakdown.map((t) => {
                    const trc = riskColor(t.risk_label as RiskLabel);
                    return (
                      <div key={t.terminal} className={`rounded-lg border p-3 ${trc.bg} ${trc.border}`}>
                        <div className={`text-sm font-bold font-mono ${trc.text}`}>{t.terminal}</div>
                        <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                          <div>{t.vessel_count} vessels</div>
                          <div>Berth: <span className="text-slate-200 font-mono">{t.berth_utilization}%</span></div>
                          <div>Crane: <span className="text-slate-200 font-mono">{t.crane_utilization}%</span></div>
                          <div>Queue: <span className="text-slate-200 font-mono">{t.queue_estimate}</span></div>
                        </div>
                        <div className={`text-[10px] font-semibold mt-1 ${trc.text}`}>{t.risk_label}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Berth status grid */}
            {portData && (
              <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <BerthGrid berths={portData.berth_records} />
              </section>
            )}

            {/* Recommendations panel */}
            <RecommendationsPanel
              data={optimize}
              loading={loadingOpt}
              onOptimize={fetchOptimize}
            />
          </div>

          {/* Right column: Copilot */}
          <div className="xl:sticky xl:top-20 xl:self-start">
            <CopilotChat portId={PORT_ID} apiUrl={API_URL} />
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm text-slate-400 py-8 px-4 sm:px-6">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Mission */}
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                PORT<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-mono">
                v0.1.0
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              AI-driven Container Congestion Predictor, Berth & Crane Optimizer, and 72-Hour Shift Operations Planner.
            </p>
          </div>

          {/* Quick Specifications */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Terminals:</span>
              <span className="text-white font-semibold">4 (T1–T4)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Berths:</span>
              <span className="text-white font-semibold">{portData?.berths ?? 12}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Cranes:</span>
              <span className="text-white font-semibold">{portData?.cranes ?? 25}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Yard:</span>
              <span className="text-white font-semibold">50,000 TEU</span>
            </div>
          </div>

          {/* Attribution & Links */}
          <div className="flex flex-col items-center md:items-end gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <a
                href={`${API_URL}/docs`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-400 transition-colors underline decoration-slate-700 underline-offset-4"
              >
                API Swagger Docs
              </a>
              <span>·</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-slate-300 transition-colors"
              >
                Back to Top ↑
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-600">
              Built for Bob AI Hackathon · Empowering Port Supervisors
            </span>
          </div>
        </div>
      </footer>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showSimulate && portData && (
        <SimulateModal
          portId={PORT_ID}
          apiUrl={API_URL}
          berths={portData.berth_records}
          cranes={portData.crane_records}
          onClose={() => setShowSimulate(false)}
        />
      )}
      {showReport && (
        <ReportModal
          portId={PORT_ID}
          apiUrl={API_URL}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
