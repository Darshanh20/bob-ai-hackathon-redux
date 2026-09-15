// CopilotChat.tsx — High-tech AI Operations Copilot with Executive Center Aesthetic

import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./types";

interface Props {
  portId: number;
  apiUrl: string;
}

const SUGGESTED = [
  "Which vessels are at critical risk?",
  "What should we prioritize in Terminal 1?",
  "Explain the 72H congestion forecast.",
  "What are the demurrage risks today?",
];

export default function CopilotChat({ portId, apiUrl }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "PORTAI Copilot active. AIS real-time telemetry stream synchronized. Ask me about congestion hotspots, vessel priority overrides, or demurrage mitigation plans.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/ports/${portId}/copilot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : (data.detail ?? "Error contacting copilot.");
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch {
      setMessages((m) => [
        {
          role: "assistant",
          text: "Telemetry link interrupted — could not reach the copilot operations server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-ocean-surface border border-ocean-border rounded-xl flex flex-col h-full min-h-[540px] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-ocean-border/80 flex items-center justify-between bg-ocean-base/50">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan/15 text-brand-cyan">
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sono text-xs font-bold text-white tracking-wider uppercase">
                PORTAI COPILOT
              </span>
              <span className="text-[9px] font-sono text-brand-green font-semibold uppercase px-1.5 py-0.2 rounded bg-brand-green/10 border border-brand-green/30">
                ONLINE
              </span>
            </div>
            <span className="text-[10px] font-sono text-[#678494] block">
              Grounded shift supervisor AI
            </span>
          </div>
        </div>

        <span className="text-[10px] font-sono text-[#85A1AF] hidden sm:inline">
          Gemini 2.0 Engine
        </span>
      </div>

      {/* Messages Log */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-ocean-base/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] p-3 rounded-lg text-xs leading-relaxed font-sono ${
                msg.role === "user"
                  ? "bg-ocean-elevated text-white border border-brand-cyan/40 shadow-sm"
                  : "bg-ocean-surface text-[#D3E4EC] border border-ocean-border shadow-md"
              }`}
            >
              {msg.role === "user" ? (
                <div>
                  <span className="text-brand-cyan font-bold mr-1">&gt;</span>
                  <span>{msg.text}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-cyan font-bold mb-1">
                    <span className="material-symbols-outlined text-[14px]">radar</span>
                    <span>PORTAI DIRECTIVE</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-xs text-[#D3E4EC]">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-ocean-surface border border-ocean-border rounded-lg p-3 text-xs text-brand-cyan font-sono flex items-center gap-2 animate-pulse">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>Analyzing port telemetry &amp; constraints…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Query Chips */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 bg-ocean-surface">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-[10px] font-sono bg-ocean-elevated border border-ocean-border text-[#85A1AF] rounded-md px-2.5 py-1 hover:border-brand-cyan/60 hover:text-white transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Query Input Box */}
      <div className="p-3 border-t border-ocean-border/80 bg-ocean-surface flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask Copilot about berths, carriers, or shift orders…"
          className="flex-1 bg-ocean-base border border-ocean-border rounded-lg px-3 py-2 text-xs text-white placeholder-[#678494] font-sono focus:outline-none focus:border-brand-cyan transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-3.5 py-2 bg-brand-cyan hover:bg-brand-cyanHover disabled:opacity-40 rounded-lg text-ocean-base font-sono text-xs font-bold transition-all shadow-[0_0_12px_rgba(40,215,209,0.2)] flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
        </button>
      </div>
    </div>
  );
}
