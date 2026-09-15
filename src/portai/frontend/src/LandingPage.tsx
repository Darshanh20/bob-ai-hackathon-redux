// LandingPage.tsx — High-tech Welcome Onboarding & Schedule Ingestion Portal

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
    <div className="min-h-screen bg-ocean-base text-[#D3E4EC] font-sans flex flex-col justify-between selection:bg-brand-cyan selection:text-ocean-base">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-ocean-base/95 backdrop-blur-md border-b border-ocean-border/80 px-6 sm:px-8 h-16 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-cyan text-2xl font-bold">radar</span>
            <span className="font-sono font-bold text-xl tracking-wider text-white">
              PORT<span className="text-brand-cyan">AI</span>
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-ocean-border"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-sono tracking-wider text-[#85A1AF] uppercase">
            <span>OPERATIONS INGESTION PORTAL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveSession && onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="h-9 px-4 rounded bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(40,215,209,0.25)] flex items-center gap-1.5 transition-all"
            >
              <span>Go To Dashboard</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
          <a
            href={`${apiUrl}/ports/${portId}/sample-csv`}
            download="sample_vessel_schedule.csv"
            className="h-9 px-3.5 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-cyan">download</span>
            <span>Sample CSV</span>
          </a>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-sono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
            </span>
            <span>Inspired by the 2021 LA Port Crisis · $10B+ Congestion Bottlenecks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Port Congestion Predictor &amp; Shift Planner
          </h1>

          <p className="text-[#85A1AF] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans">
            Eliminate reactive spreadsheet management. Ingest your vessel schedules, predict harbor bottlenecks 
            up to 72 hours ahead, and dispatch optimal berth and crane assignments automatically.
          </p>
        </div>

        {/* ── How It Works (4 Steps) ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-sono font-semibold tracking-wider text-[#85A1AF] uppercase">
              4-Phase Maritime Intelligence Engine
            </h2>
            <span className="text-xs font-sono text-brand-cyan">Real-time CP-SAT Optimization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-ocean-surface rounded-xl p-5 border border-ocean-border flex flex-col justify-between hover:border-brand-cyan/50 transition-all group shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-ocean-elevated border border-ocean-border flex items-center justify-center font-sono font-bold text-brand-cyan text-sm group-hover:scale-105 transition-transform">
                    01
                  </span>
                  <span className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider">Ingestion</span>
                </div>
                <h3 className="font-sono font-bold text-white text-sm group-hover:text-brand-cyan transition-colors">
                  Upload Vessel Schedule
                </h3>
                <p className="text-xs text-[#85A1AF] leading-relaxed">
                  Feed incoming vessel ETAs, ETDs, container volumes (TEU), ship sizes, and cargo urgency (Urgent, High, Normal).
                </p>
              </div>
              <div className="pt-4 text-[10px] font-sono text-[#678494] border-t border-ocean-border/60 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand-cyan">table_chart</span>
                <span>CSV manifests &amp; dynamic berths</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-ocean-surface rounded-xl p-5 border border-ocean-border flex flex-col justify-between hover:border-brand-cyan/50 transition-all group shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-ocean-elevated border border-ocean-border flex items-center justify-center font-sono font-bold text-brand-cyan text-sm group-hover:scale-105 transition-transform">
                    02
                  </span>
                  <span className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider">Analytics</span>
                </div>
                <h3 className="font-sono font-bold text-white text-sm group-hover:text-brand-cyan transition-colors">
                  72-Hour Hotspot Forecast
                </h3>
                <p className="text-xs text-[#85A1AF] leading-relaxed">
                  Mathematical engine scores congestion from 0 to 100 across 4 rolling windows (NOW, 24H, 48H, 72H) per terminal.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-sono text-[#678494] border-t border-ocean-border/60 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand-red">timeline</span>
                <span>Detects spikes before arrivals</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-ocean-surface rounded-xl p-5 border border-ocean-border flex flex-col justify-between hover:border-brand-cyan/50 transition-all group shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-ocean-elevated border border-ocean-border flex items-center justify-center font-sono font-bold text-brand-cyan text-sm group-hover:scale-105 transition-transform">
                    03
                  </span>
                  <span className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider">Optimization</span>
                </div>
                <h3 className="font-sono font-bold text-white text-sm group-hover:text-brand-cyan transition-colors">
                  Berth &amp; Crane Allocation
                </h3>
                <p className="text-xs text-[#85A1AF] leading-relaxed">
                  Eliminates naive first-come queues. Prioritizes urgent cargo, matches berth capacities, and diverts ships to free terminals.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-sono text-[#678494] border-t border-ocean-border/60 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand-green">tune</span>
                <span>↓ 40%–55% dwell reduction</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-ocean-surface rounded-xl p-5 border border-ocean-border flex flex-col justify-between hover:border-brand-cyan/50 transition-all group shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-ocean-elevated border border-ocean-border flex items-center justify-center font-sono font-bold text-brand-cyan text-sm group-hover:scale-105 transition-transform">
                    04
                  </span>
                  <span className="text-[10px] font-sono text-[#85A1AF] uppercase tracking-wider">Execution</span>
                </div>
                <h3 className="font-sono font-bold text-white text-sm group-hover:text-brand-cyan transition-colors">
                  Simulation &amp; AI Copilot
                </h3>
                <p className="text-xs text-[#85A1AF] leading-relaxed">
                  Test equipment breakdown scenarios in-memory without risk, and chat with Gemini AI for instant shift dispatch orders.
                </p>
              </div>
              <div className="pt-4 text-[10px] font-sono text-[#678494] border-t border-ocean-border/60 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand-blue">smart_toy</span>
                <span>Grounded AI shift supervisor</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CSV Upload Section ───────────────────────────────────── */}
        <div className="bg-ocean-surface rounded-2xl border border-ocean-border p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
            <div>
              <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold block mb-1">
                SCHEDULE INGESTION
              </span>
              <h2 className="text-xl font-bold text-white">Upload Manifest &amp; Launch Command Center</h2>
              <p className="text-xs text-[#85A1AF] mt-0.5">
                Upload your vessel schedule CSV to trigger automated congestion modeling and optimal dispatching.
              </p>
            </div>
            <a
              href={`${apiUrl}/ports/${portId}/sample-csv`}
              download="sample_vessel_schedule.csv"
              className="h-9 px-4 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors shrink-0 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] text-brand-cyan">description</span>
              <span>Download Demo CSV</span>
            </a>
          </div>

          {error && (
            <div className="bg-brand-red/20 border border-brand-red/60 rounded-lg p-3 text-xs text-brand-red flex justify-between items-center font-sono">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </span>
              <button onClick={() => setError(null)} className="text-white hover:text-brand-red">✕</button>
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
                ? "border-brand-cyan bg-brand-cyan/10 scale-[0.99]"
                : "border-ocean-border hover:border-brand-cyan/70 bg-ocean-base/60"
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
              <div className="w-14 h-14 mx-auto rounded-full bg-ocean-elevated border border-brand-cyan/40 flex items-center justify-center text-2xl text-brand-cyan shadow-[0_0_16px_rgba(40,215,209,0.2)]">
                {uploading ? (
                  <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                )}
              </div>

              <div>
                <span className="text-sm font-semibold text-white block">
                  {uploading ? "Analyzing and uploading vessel schedule…" : "Click to browse or drag and drop your schedule CSV"}
                </span>
                <p className="text-xs text-[#85A1AF] mt-1 font-mono">
                  Standard maritime schedule CSV manifests supported
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {["Vessel ID", "ETA", "ETD", "Containers (TEU)", "Size", "Priority", "Terminal"].map((col) => (
                  <span
                    key={col}
                    className="text-[10px] font-sono px-2.5 py-0.5 rounded bg-ocean-elevated text-[#D3E4EC] border border-ocean-border"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Local Persistence Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#678494] font-sono pt-2 border-t border-ocean-border/60 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-brand-green">verified</span>
              <span>Active schedules are automatically persisted locally for 72 hours</span>
            </span>
            <span>You can delete or replace schedules anytime in the dashboard</span>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-ocean-border/60 bg-ocean-base px-6 py-4 text-center text-xs text-[#678494] font-sono flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">PORT<span className="text-brand-cyan">AI</span></span>
          <span>·</span>
          <span>Maritime Operations Engine</span>
        </div>
        <div>
          Powered by Fast CP-SAT Solver &amp; Google Gemini 2.0
        </div>
      </footer>
    </div>
  );
}
