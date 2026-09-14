// LandingPage.tsx — Welcome onboarding & CSV ingestion page

import React, { useState, useRef } from "react";

interface Props {
  apiUrl: string;
  portId: number;
  onUploadSuccess: (vesselsImported: number, terminals: string[]) => void;
  hasActiveSession?: boolean;
  onReturnToDashboard?: () => void;
}

export default function LandingPage({
  apiUrl,
  portId,
  onUploadSuccess,
  hasActiveSession,
  onReturnToDashboard,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiUrl}/ports/${portId}/vessels/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      onUploadSuccess(data.vessels_imported, data.terminals_covered);
    } catch (err: any) {
      setError(err.message || "Failed to process vessel schedule");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight">
              PORT<span className="text-indigo-400">AI</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
              Operations Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveSession && onReturnToDashboard && (
              <button
                onClick={onReturnToDashboard}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1"
              >
                <span>Dashboard ➔</span>
              </button>
            )}
            <a
              href={`${apiUrl}/ports/${portId}/sample-csv`}
              download="sample_vessel_schedule.csv"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>↓ Download Sample CSV</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Inspired by the 2021 LA Port Crisis ($10B+ Supply Chain Bottleneck)
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Port Congestion Predictor &amp; Shift Planner
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminate reactive spreadsheet management. Ingest your vessel schedules, predict harbor bottlenecks 
            up to 72 hours ahead, and dispatch optimal berth and crane assignments automatically.
          </p>
        </div>

        {/* ── How It Works (4 Steps) ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              How PortAI Works · 4-Phase Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                    01
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Ingestion</span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  Upload Vessel Schedule
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Feed incoming vessel ETAs, ETDs, container volumes (TEU), ship sizes, and cargo urgency (Urgent, High, Normal).
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-slate-500">
                → CSV manifests &amp; dynamic terminals
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                    02
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Analytics</span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  72-Hour Hotspot Forecast
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mathematical engine scores congestion from 0 to 100 across 4 rolling windows (NOW, 24H, 48H, 72H) per terminal.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-slate-500">
                → Detects spikes before ships arrive
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                    03
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Optimization</span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  Berth &amp; Crane Allocation
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminates naive first-come queues. Prioritizes urgent cargo, matches berth capacities, and diverts ships to free terminals.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-slate-500">
                → 40%–55% ship wait time reduction
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                    04
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Execution</span>
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  Simulation &amp; AI Copilot
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Test equipment breakdown scenarios in-memory without risk, and chat with Gemini AI for instant shift dispatch orders.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-mono text-slate-500">
                → Grounded Gemini AI operations
              </div>
            </div>
          </div>
        </div>

        {/* ── Downside: CSV Upload Section ───────────────────────────────────── */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Get Started · Upload Schedule Manifest</h2>
              <p className="text-xs text-slate-400">
                Upload your vessel schedule CSV to launch the live operations dashboard. Cached locally for 72 hours.
              </p>
            </div>
            <a
              href={`${apiUrl}/ports/${portId}/sample-csv`}
              download="sample_vessel_schedule.csv"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 transition-colors shrink-0 flex items-center gap-2"
            >
              <span>📄 Download Demo CSV Template</span>
            </a>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-700 rounded-lg p-3 text-xs text-red-200 flex justify-between items-center">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-400 bg-indigo-950/30 scale-[0.99]"
                : "border-slate-700 hover:border-indigo-500/70 bg-slate-950/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-xl text-indigo-400">
                {uploading ? "⏳" : "🚢"}
              </div>

              <div>
                <span className="text-sm font-semibold text-white">
                  {uploading ? "Analyzing and uploading vessel schedule…" : "Click to browse or drag and drop your schedule CSV"}
                </span>
                <p className="text-xs text-slate-500 mt-1">Supports standard maritime schedule CSV manifests</p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {["Vessel ID", "ETA", "ETD", "Containers", "Size", "Priority", "Terminal"].map((col) => (
                  <span key={col} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Local Persistence Notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
            <span>✓ Active schedule is cached locally for 72h</span>
            <span>You can delete and replace the schedule anytime from the dashboard</span>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        PORTAI · Built for Bob AI Hackathon · Powered by Google Gemini 2.0 &amp; FastAPI
      </footer>
    </div>
  );
}
