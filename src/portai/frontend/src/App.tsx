// App.tsx — Maritime Command Center with Collapsible Side Navigation Slider & Modular Pages

import React, { useCallback, useEffect, useRef, useState } from "react";
import CopilotChat from "./CopilotChat";
import DispatchPage from "./DispatchPage";
import LandingPage from "./LandingPage";
import OptimizePromptModal from "./OptimizePromptModal";
import OverviewPage from "./OverviewPage";
import ReportsPage from "./ReportsPage";
import SidebarNav from "./SidebarNav";
import SimulationPage from "./SimulationPage";
import TerminalsPage from "./TerminalsPage";
import VesselsPage from "./VesselsPage";
import { CongestionData, NavPage, OptimizeData, PortData } from "./types";

const API_URL = process.env.REACT_APP_PUBLIC_API_URL ?? "http://localhost:8000";
const PORT_ID = 1;
const POLL_MS = 30_000;
const STORAGE_KEY = "portai_schedule_session";
const MAX_SESSION_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours

function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session?.uploadedAt) return false;
    const age = Date.now() - session.uploadedAt;
    return age < MAX_SESSION_AGE_MS;
  } catch {
    return false;
  }
}

const PAGE_TITLES: Record<NavPage, { title: string; subtitle: string }> = {
  overview: { title: "Command Center", subtitle: "Real-time Operations Overview" },
  vessels: { title: "Vessel Operations", subtitle: "AIS Fleet Live Tracking & Cargo Priority" },
  terminals: { title: "Terminal Hub", subtitle: "Berth Matrix & STS Crane Gangs" },
  dispatch: { title: "Dispatch Directives", subtitle: "AI CP-SAT Optimizer & Berthing Orders" },
  simulation: { title: "What-If Simulator", subtitle: "Contingency Stress Testing & Incident Lab" },
  reports: { title: "Audit & Reports", subtitle: "72-Hour Shift Briefings & Demurrage Analysis" },
};

export default function App() {
  const [sessionActive, setSessionActive] = useState<boolean>(() => isSessionValid());
  const [currentPage, setCurrentPage] = useState<NavPage>("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);

  const [portData, setPortData] = useState<PortData | null>(null);
  const [congestion, setCongestion] = useState<CongestionData | null>(null);
  const [optimize, setOptimize] = useState<OptimizeData | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [showOptimizePrompt, setShowOptimizePrompt] = useState(false);
  const [promptCounts, setPromptCounts] = useState<{ vessels: number; terminals: number }>({
    vessels: 0,
    terminals: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Generic popup modal state
  const [genericModal, setGenericModal] = useState<{
    open: boolean;
    title: string;
    body: string;
  }>({
    open: false,
    title: "",
    body: "",
  });

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
      const data = await res.json();
      setOptimize(data);
      setToast(
        `AI Optimization complete! Wait times reduced by ${data.summary.improvement_percent}%.`
      );
      setTimeout(() => setToast(null), 5000);
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
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ uploadedAt: Date.now(), vesselsCount: data.vessels_imported })
      );
      setSessionActive(true);
      setOptimize(null);
      setPromptCounts({ vessels: data.vessels_imported, terminals: data.terminals_covered.length });
      setShowOptimizePrompt(true);
      await Promise.all([fetchPort(), fetchCongestion()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Callback from LandingPage upload ──────────────────────────────────────
  const handleLandingUploadSuccess = async (vesselsImported: number, terminals: string[]) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ uploadedAt: Date.now(), vesselsCount: vesselsImported })
    );
    setSessionActive(true);
    setOptimize(null);
    setPromptCounts({ vessels: vesselsImported, terminals: terminals.length });
    setShowOptimizePrompt(true);
    await Promise.all([fetchPort(), fetchCongestion()]);
  };

  // ── Delete schedule ───────────────────────────────────────────────────────
  const handleDeleteSchedule = async () => {
    if (!window.confirm("Are you sure you want to delete this schedule and upload a new one?")) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ports/${PORT_ID}/vessels`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
      localStorage.removeItem(STORAGE_KEY);
      setSessionActive(false);
      setPortData(null);
      setCongestion(null);
      setOptimize(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Initial load + polling ─────────────────────────────────────────────────
  useEffect(() => {
    if (sessionActive) {
      Promise.all([fetchPort(), fetchCongestion()]).catch((e) => setError(e.message));
      timerRef.current = setInterval(() => {
        fetchCongestion().catch(() => {});
      }, POLL_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut listener (Cmd/Ctrl + K to toggle Copilot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const rm = congestion?.raw_metrics;

  const openInfoModal = (title: string, body: string) => {
    setGenericModal({ open: true, title, body });
  };

  const closeInfoModal = () => {
    setGenericModal({ open: false, title: "", body: "" });
  };

  if (!sessionActive) {
    return (
      <LandingPage
        apiUrl={API_URL}
        portId={PORT_ID}
        onUploadSuccess={handleLandingUploadSuccess}
        hasActiveSession={portData !== null && (rm?.total_vessels_in_schedule ?? 0) > 0}
        onReturnToDashboard={() => setSessionActive(true)}
      />
    );
  }

  const pageInfo = PAGE_TITLES[currentPage];

  return (
    <div className="min-h-screen bg-ocean-base text-[#D3E4EC] font-sans antialiased selection:bg-brand-cyan selection:text-ocean-base">
      {/* ── 1. SIDE NAVIGATION SLIDER ──────────────────────────────────── */}
      <SidebarNav
        currentPage={currentPage}
        onSelectPage={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        vesselCount={rm?.total_vessels_in_schedule ?? 20}
        terminalCount={congestion?.terminal_breakdown?.length ?? 3}
        onOpenUpload={() => fileInputRef.current?.click()}
        onReturnToLanding={() => setSessionActive(false)}
        portName={portData?.name ?? "ABC INTERNATIONAL PORT"}
      />

      {/* ── 2. MAIN CONTENT AREA (OFFSET BY SIDEBAR) ──────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        } flex flex-col min-h-screen`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full bg-ocean-base/95 backdrop-blur-md border-b border-ocean-border/80 px-4 sm:px-8 h-16 flex items-center justify-between transition-colors">
          {/* Left: Mobile Sidebar Toggle + Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-ocean-surface hover:bg-ocean-elevated text-[#85A1AF] hover:text-white border border-ocean-border lg:hidden transition-colors"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <div className="flex items-center gap-2.5">
              <span className="font-sono font-bold text-white text-base sm:text-lg">
                {pageInfo.title}
              </span>
              <span className="hidden sm:inline text-ocean-border">/</span>
              <span className="hidden sm:inline text-xs font-sono text-[#85A1AF]">
                {portData?.name ?? "ABC INTERNATIONAL PORT"}
              </span>
            </div>
          </div>

          {/* Right: Status & Primary Actions */}
          <div className="flex items-center gap-3">
            {/* Live Ping Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-ocean-surface border border-ocean-border text-xs font-sono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
              </span>
              <span className="text-brand-green tracking-wide uppercase font-semibold text-[11px]">
                LIVE AIS
              </span>
            </div>

            {/* Upload CSV hidden input & button */}
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
              title="Upload new vessel schedule CSV"
              className="h-9 px-3 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors hidden sm:flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-brand-cyan">upload_file</span>
              <span>{uploading ? "Uploading…" : "Upload CSV"}</span>
            </button>

            {/* Delete Schedule Button */}
            <button
              onClick={handleDeleteSchedule}
              disabled={deleting}
              title="Delete current schedule"
              className="h-9 px-2.5 sm:px-3 rounded bg-brand-red/10 hover:bg-brand-red/20 text-brand-red font-sono text-xs font-semibold uppercase tracking-wider border border-brand-red/30 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span className="hidden md:inline">{deleting ? "Deleting…" : "Delete"}</span>
            </button>

            {/* Run Optimizer Trigger */}
            <button
              onClick={fetchOptimize}
              disabled={loadingOpt}
              className="h-9 px-3.5 sm:px-4 rounded-md bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold tracking-wider uppercase shadow-[0_0_16px_rgba(40,215,209,0.25)] flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>{loadingOpt ? "Optimizing…" : "Run Optimizer"}</span>
            </button>

            {/* Copilot Toggle Trigger */}
            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              title="Toggle AI Copilot"
              className={`h-9 px-2.5 rounded-lg border font-sono text-xs flex items-center gap-1.5 transition-all ${
                copilotOpen
                  ? "bg-brand-cyan text-ocean-base border-brand-cyan shadow-[0_0_12px_rgba(40,215,209,0.3)] font-bold"
                  : "bg-ocean-surface hover:bg-ocean-elevated text-brand-cyan border-brand-cyan/40"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span className="hidden xl:inline">Copilot</span>
            </button>
          </div>
        </header>

        {/* Quiet Sub-bar */}
        <div className="w-full bg-ocean-base border-b border-ocean-border/50 px-4 sm:px-8 py-2 flex items-center justify-between text-xs text-[#85A1AF]">
          <div className="flex items-center gap-2">
            <span className="font-sono text-[11px] uppercase text-white font-medium">
              {pageInfo.subtitle}
            </span>
          </div>
          <div className="flex items-center gap-3 font-sono text-[11px]">
            <span className="text-[#678494] hidden sm:inline">
              {lastUpdated ? `Telemetry synced ${lastUpdated}` : "Polling 30s"}
            </span>
            <span className="text-brand-green">● Solver Online</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
          {/* Toast Notification */}
          {toast && (
            <div className="mb-6 bg-brand-green/15 border border-brand-green/50 rounded-xl px-4 py-3 text-xs text-brand-green font-sono flex justify-between items-center shadow-lg animate-fadeIn">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{toast}</span>
              </span>
              <button onClick={() => setToast(null)} className="text-brand-green hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-brand-red/20 border border-brand-red/60 rounded-xl px-4 py-3 text-xs text-brand-red font-sono flex justify-between items-center animate-fadeIn">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </span>
              <button onClick={() => setError(null)} className="text-white hover:text-brand-red">
                ✕
              </button>
            </div>
          )}

          {/* Dynamic Page Routing */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className={copilotOpen ? "xl:col-span-8" : "xl:col-span-12"}>
              {currentPage === "overview" && (
                <OverviewPage
                  portData={portData}
                  congestion={congestion}
                  optimize={optimize}
                  loadingOpt={loadingOpt}
                  onOptimize={fetchOptimize}
                  onNavigatePage={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onOpenInfoModal={openInfoModal}
                  onAuthorizeDispatch={() => {
                    setToast(
                      "Directives transmitted to Harbor Master & Harbor Pilots via VHF Link. COSCO-DELTA diverted to T2-01."
                    );
                    setTimeout(() => setToast(null), 6000);
                  }}
                />
              )}

              {currentPage === "vessels" && (
                <VesselsPage
                  portData={portData}
                  congestion={congestion}
                  optimize={optimize}
                  onOpenOptimize={fetchOptimize}
                />
              )}

              {currentPage === "terminals" && (
                <TerminalsPage
                  portData={portData}
                  congestion={congestion}
                  onOpenSimulation={() => setCurrentPage("simulation")}
                />
              )}

              {currentPage === "dispatch" && (
                <DispatchPage
                  optimize={optimize}
                  loadingOpt={loadingOpt}
                  onOptimize={fetchOptimize}
                  onAuthorizeDispatch={() => {
                    setToast(
                      "Directives transmitted to Harbor Master & Harbor Pilots via VHF Link. COSCO-DELTA diverted to T2-01."
                    );
                    setTimeout(() => setToast(null), 6000);
                  }}
                />
              )}

              {currentPage === "simulation" && portData && (
                <SimulationPage
                  portId={PORT_ID}
                  apiUrl={API_URL}
                  berths={portData.berth_records}
                  cranes={portData.crane_records}
                />
              )}

              {currentPage === "reports" && (
                <ReportsPage portId={PORT_ID} apiUrl={API_URL} />
              )}
            </div>

            {/* Slide-out / Side Copilot Panel (when open) */}
            {copilotOpen && (
              <div className="xl:col-span-4 xl:sticky xl:top-20 animate-fadeIn">
                <CopilotChat portId={PORT_ID} apiUrl={API_URL} />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-ocean-border/60 bg-ocean-base text-[#85A1AF] py-6 px-4 sm:px-8">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                PORT<span className="text-brand-cyan">AI</span>
              </span>
              <span>·</span>
              <span>Maritime Operations Suite</span>
              <span>·</span>
              <span className="text-brand-green">CP-SAT Engine Active</span>
            </div>

            <div className="flex items-center gap-4 text-[#678494]">
              <a
                href={`${API_URL}/docs`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-cyan transition-colors underline decoration-ocean-border"
              >
                FastAPI Swagger Docs
              </a>
              <span>·</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-white transition-colors"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ── 3. FLOATING COPILOT ACTION BUTTON (BOTTOM RIGHT) ───────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => setCopilotOpen(!copilotOpen)}
          className="group flex items-center gap-3 pl-3.5 pr-4 py-2.5 rounded-full bg-ocean-surface/95 hover:bg-ocean-elevated border border-brand-cyan/40 hover:border-brand-cyan shadow-[0_0_20px_rgba(40,215,209,0.25)] backdrop-blur-md transition-all cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-cyan/15 text-brand-cyan group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-sono text-xs font-bold text-white tracking-wider uppercase">
                PORTAI COPILOT
              </span>
              <span className="text-[10px] font-sono text-brand-green font-semibold uppercase px-1.5 py-0.2 rounded bg-brand-green/10">
                ONLINE
              </span>
            </div>
            <span className="text-[11px] font-sono text-brand-red flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></span>
              {copilotOpen ? "Click to Close" : "T1 Bottleneck Alert · Open"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-ocean-border/80 text-[10px] font-sono text-[#85A1AF]">
            <kbd className="px-1.5 py-0.5 rounded bg-ocean-base border border-ocean-border text-white text-[10px]">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* ── 4. GENERIC POPUP MODAL ────────────────────────────────────────── */}
      {genericModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-ocean-surface border border-ocean-border rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-ocean-border">
              <h3 className="font-sono text-base font-bold text-white">{genericModal.title}</h3>
              <button onClick={closeInfoModal} className="text-[#85A1AF] hover:text-white">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="py-4 text-sm text-[#D3E4EC] leading-relaxed whitespace-pre-line font-sans">
              {genericModal.body}
            </div>
            <div className="pt-3 border-t border-ocean-border flex justify-end gap-3">
              <button
                onClick={closeInfoModal}
                className="px-4 py-2 rounded bg-ocean-elevated text-xs font-sono text-white hover:bg-ocean-border transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. OPTIMIZE PROMPT MODAL ──────────────────────────────────────── */}
      {showOptimizePrompt && (
        <OptimizePromptModal
          vesselsCount={promptCounts.vessels}
          terminalsCount={promptCounts.terminals}
          onOptimize={() => {
            setShowOptimizePrompt(false);
            fetchOptimize();
          }}
          onDismiss={() => {
            setShowOptimizePrompt(false);
            setToast(
              "Operating in standard baseline schedule (FCFS). Click 'Run Optimizer' anytime."
            );
            setTimeout(() => setToast(null), 6000);
          }}
        />
      )}
    </div>
  );
}
