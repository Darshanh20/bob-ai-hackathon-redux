"""
ai_copilot.py
=============
LLM-powered port operations copilot using the Google Gemini API (google-genai SDK).

Public API
----------
    build_context(port_id, db)              -> dict   grounding context
    ask_copilot(port_id, db, question)      -> str    answer text
    generate_report(port_id, db)            -> dict   structured 72-h report
    explain_terminal(port_id, terminal, db) -> str    terminal risk narrative
"""

from __future__ import annotations

import json
import os
from typing import Any

from google import genai
from google.genai import types as genai_types
from sqlalchemy.orm import Session

from .congestion_engine import calculate_congestion
from .optimizer import optimize_berths, optimize_cranes

# ── config ────────────────────────────────────────────────────────────────────
MODEL      = "gemini-2.0-flash"
MAX_TOKENS = 512
TIMEOUT    = 30

FALLBACK_MSG = (
    "The AI copilot is temporarily unavailable (API timeout or rate limit). "
    "Please check the dashboard metrics directly and retry in a moment."
)

# ── system prompts ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are the AI operations copilot for ABC International Port.
You ONLY reason from the JSON context block provided in the user message.
Never invent vessel codes, berth codes, terminal names, or numbers that are \
not present in the context.
Keep every answer to 2-4 sentences, operational and concrete.
Always reference specific IDs (vessel codes, berth codes, terminal names) \
from the context when they are relevant.
Do not use markdown formatting — plain sentences only."""

REPORT_SYSTEM_PROMPT = """\
You are a port operations analyst generating a structured 72-hour outlook report.
Extract the requested fields ONLY from the JSON context provided.
Return your answer as a valid JSON object with exactly these keys:
  overall_risk, expected_vessels, high_risk_terminal, peak_congestion_window,
  key_risks (list of strings), ai_recommendations (list of strings),
  expected_impact (object with keys: wait_time_reduction_pct, vessels_cleared, \
queue_reduction).
Return only the JSON object, no markdown fences, no extra text.
Base every number and label strictly on the context — do not invent data."""


def _make_client() -> genai.Client:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")  # reuses existing env var name
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set in src/portai/backend/.env")
    return genai.Client(api_key=api_key)


# ── context builder ───────────────────────────────────────────────────────────

def build_context(port_id: int, db: Session) -> dict[str, Any]:
    """
    Assemble a compact, grounded JSON context for the LLM.
    Contains only data derived from the live DB — no hallucination surface.
    """
    congestion = calculate_congestion(port_id, db)
    berth_plan = optimize_berths(port_id, db)
    crane_plan = optimize_cranes(port_id, db, berth_plan["assignments"])

    priority_order = {"urgent": 3, "high": 2, "normal": 1}
    size_order     = {"large": 3, "medium": 2, "small": 1}
    terminal_scores = {
        t["terminal"]: t["congestion_score"]
        for t in congestion["terminal_breakdown"]
    }

    def vessel_risk_score(a: dict) -> tuple:
        return (
            -priority_order.get(a["priority"], 0),
            -size_order.get(a["size"], 0),
            -terminal_scores.get(a["home_terminal"], 0),
        )

    top5 = sorted(berth_plan["assignments"], key=vessel_risk_score)[:5]

    moves = [
        {
            "vessel":   m["vessel_code"],
            "priority": m["priority"],
            "from":     m["from_terminal"],
            "to":       m["to_terminal"],
            "berth":    m["assigned_berth"],
        }
        for m in berth_plan["recommended_moves"]
    ]

    return {
        "port":        congestion["port_name"],
        "computed_at": congestion["computed_at"],
        "overall": {
            "congestion_score":  congestion["overall"]["congestion_score"],
            "risk_label":        congestion["overall"]["risk_label"],
            "peak_window_start": congestion["overall"]["peak_window_start"],
            "peak_window_end":   congestion["overall"]["peak_window_end"],
        },
        "raw_metrics":        congestion["raw_metrics"],
        "forecast":           congestion["forecast"],
        "terminal_breakdown": congestion["terminal_breakdown"],
        "optimization": {
            "total_vessels":       berth_plan["total_vessels"],
            "vessels_assigned":    berth_plan["vessels_assigned"],
            "conflicts_resolved":  berth_plan["conflicts_resolved"],
            "avg_wait_before_h":   berth_plan["avg_wait_before_h"],
            "avg_wait_after_h":    berth_plan["avg_wait_after_h"],
            "improvement_percent": berth_plan["improvement_percent"],
        },
        "top5_risk_vessels": [
            {
                "vessel_code":      v["vessel_code"],
                "size":             v["size"],
                "priority":         v["priority"],
                "containers":       v["containers"],
                "terminal":         v["home_terminal"],
                "eta":              v["eta"],
                "assigned_berth":   v["berth_code"],
                "wait_hours":       v["wait_hours"],
                "is_terminal_move": v["is_terminal_move"],
            }
            for v in top5
        ],
        "recommended_moves":        moves,
        "crane_terminal_summaries": crane_plan["terminal_summaries"],
    }


# ── core LLM call ─────────────────────────────────────────────────────────────

def _call_llm(system: str, user_message: str) -> str:
    try:
        client = _make_client()
        response = client.models.generate_content(
            model=MODEL,
            contents=user_message,
            config=genai_types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=MAX_TOKENS,
                temperature=0.2,
            ),
        )
        return response.text.strip()
    except Exception as exc:
        msg = str(exc).lower()
        # Surface auth/config problems so the endpoint can return a 503
        if "api key" in msg or "invalid_argument" in msg or "permission" in msg or "unauthenticated" in msg:
            raise RuntimeError(f"Gemini API error: {exc}") from exc
        # Swallow transient errors (quota, timeout, server errors) gracefully
        return FALLBACK_MSG


# ── public functions ──────────────────────────────────────────────────────────

def ask_copilot(port_id: int, db: Session, question: str) -> str:
    ctx      = build_context(port_id, db)
    user_msg = (
        f"PORT CONTEXT (use only these facts):\n"
        f"{json.dumps(ctx, indent=2)}\n\n"
        f"QUESTION: {question}"
    )
    return _call_llm(SYSTEM_PROMPT, user_msg)


def generate_report(port_id: int, db: Session) -> dict[str, Any]:
    ctx      = build_context(port_id, db)
    user_msg = (
        f"PORT CONTEXT:\n{json.dumps(ctx, indent=2)}\n\n"
        "Generate the 72-hour operations report JSON now."
    )
    raw = _call_llm(REPORT_SYSTEM_PROMPT, user_msg)

    if raw == FALLBACK_MSG:
        return _fallback_report(ctx)

    try:
        cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        report  = json.loads(cleaned)
        report["generated_at"] = ctx["computed_at"]
        report["port"]         = ctx["port"]
        return report
    except (json.JSONDecodeError, KeyError):
        return _fallback_report(ctx, llm_note=raw)


def _fallback_report(ctx: dict, llm_note: str = "") -> dict[str, Any]:
    terminals = ctx["terminal_breakdown"]
    worst_t   = max(terminals, key=lambda t: t["congestion_score"])
    opt       = ctx["optimization"]

    risks: list[str] = []
    for t in terminals:
        if t["risk_label"] in ("HIGH", "CRITICAL"):
            risks.append(
                f"Terminal {t['terminal']} at {t['risk_label']} risk "
                f"({t['vessel_count']} vessels, {t['queue_estimate']} queued)"
            )
    for v in ctx["top5_risk_vessels"]:
        if v["priority"] in ("urgent", "high"):
            risks.append(
                f"{v['vessel_code']} ({v['priority']}, {v['size']}) "
                f"arriving {v['eta']} at {v['terminal']}"
            )

    recommendations: list[str] = []
    for m in ctx["recommended_moves"]:
        recommendations.append(
            f"Redirect {m['vessel']} [{m['priority']}] from "
            f"{m['from']} to {m['to']} berth {m['berth']}"
        )
    recommendations.append(
        f"Apply optimised berth schedule: reduces avg wait from "
        f"{opt['avg_wait_before_h']}h to {opt['avg_wait_after_h']}h "
        f"({opt['improvement_percent']}% improvement)"
    )

    report: dict[str, Any] = {
        "port":          ctx["port"],
        "generated_at":  ctx["computed_at"],
        "overall_risk":  ctx["overall"]["risk_label"],
        "expected_vessels":      ctx["raw_metrics"]["total_vessels_in_schedule"],
        "high_risk_terminal":    worst_t["terminal"],
        "peak_congestion_window": (
            f"{ctx['overall']['peak_window_start']} to "
            f"{ctx['overall']['peak_window_end']}"
        ),
        "key_risks":          risks[:6],
        "ai_recommendations": recommendations[:6],
        "expected_impact": {
            "wait_time_reduction_pct": opt["improvement_percent"],
            "vessels_cleared":         opt["vessels_assigned"],
            "queue_reduction":         opt["conflicts_resolved"],
        },
    }
    if llm_note:
        report["_llm_note"] = llm_note
    return report


def explain_terminal(port_id: int, terminal: str, db: Session) -> str:
    ctx    = build_context(port_id, db)
    t_data = next(
        (t for t in ctx["terminal_breakdown"] if t["terminal"] == terminal),
        None,
    )
    if t_data is None:
        return f"Terminal {terminal} not found in port {port_id} data."

    t_vessels = [v for v in ctx["top5_risk_vessels"] if v["terminal"] == terminal]
    t_moves   = [m for m in ctx["recommended_moves"]  if m["from"] == terminal]

    terminal_ctx = {
        "terminal":          terminal,
        "metrics":           t_data,
        "top_risk_vessels":  t_vessels,
        "recommended_moves": t_moves,
        "port_overall_risk": ctx["overall"]["risk_label"],
    }
    user_msg = (
        f"TERMINAL CONTEXT:\n{json.dumps(terminal_ctx, indent=2)}\n\n"
        f"Explain in 2-4 sentences why terminal {terminal} is at "
        f"{t_data['risk_label']} risk and what the key operational drivers are."
    )
    return _call_llm(SYSTEM_PROMPT, user_msg)
