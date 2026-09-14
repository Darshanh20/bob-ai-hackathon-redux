// CopilotChat.tsx — AI Copilot chat panel

import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./types";

interface Props {
  portId: number;
  apiUrl: string;
}

const SUGGESTED = [
  "Which vessels are at risk?",
  "What should we prioritize in T1?",
  "Explain the congestion forecast.",
];

export default function CopilotChat({ portId, apiUrl }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "I'm the PORTAI operations copilot. Ask me anything about current port status, vessel risk, or recommendations." },
  ]);
  const [input, setInput]   = useState("");
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
      setMessages((m) => [...m, { role: "assistant", text: "Network error — could not reach the copilot." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-full min-h-[480px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">AI Copilot</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-[12px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600/60 text-white border border-indigo-600"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 animate-pulse">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-[11px] bg-slate-800 border border-slate-600 text-slate-300 rounded-full px-2.5 py-1 hover:border-indigo-500 hover:text-indigo-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-slate-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about vessels, berths, terminals…"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-xs font-bold transition-colors"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
