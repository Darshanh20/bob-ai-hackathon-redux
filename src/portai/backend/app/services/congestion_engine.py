"""
congestion_engine.py
====================
Core analytics service for port congestion scoring.

Public API
----------
    calculate_congestion(port_id: int, db: Session) -> dict

The returned dict contains:
    overall_score       float  0-100
    risk_label          str    LOW | MEDIUM | HIGH | CRITICAL
    raw_metrics         dict   utilisation %, queue count, etc.
    forecast            list   4 windows: NOW/24H/48H/72H
    terminal_breakdown  list   per-terminal score + risk
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from ..models import Berth, Crane, Port, Vessel

# ── crane demand by vessel size ───────────────────────────────────────────────
CRANE_DEMAND: dict[str, tuple[int, int]] = {
    "small":  (1, 2),
    "medium": (2, 3),
    "large":  (3, 4),
}

# ── scoring weights ───────────────────────────────────────────────────────────
W_BERTH    = 0.40   # berth utilisation
W_CRANE    = 0.30   # crane utilisation
W_INCOMING = 0.20   # incoming pressure (next 8 h)
W_QUEUE    = 0.10   # unserviceable vessels

# ── risk thresholds ───────────────────────────────────────────────────────────
def _risk_label(score: float) -> str:
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


# ── crane demand helper ───────────────────────────────────────────────────────
def _cranes_needed(size: str) -> float:
    """Return average cranes needed for a vessel size."""
    lo, hi = CRANE_DEMAND.get(size, (2, 3))
    return (lo + hi) / 2.0


# ── berth-fit check ───────────────────────────────────────────────────────────
SIZE_ORDER = {"small": 0, "medium": 1, "large": 2}

def _berth_fits(berth: Berth, vessel_size: str) -> bool:
    """True if berth's max_vessel_size can accommodate vessel_size."""
    return SIZE_ORDER.get(berth.max_vessel_size, 0) >= SIZE_ORDER.get(vessel_size, 0)


# ── window scoring ────────────────────────────────────────────────────────────

def _score_window(
    vessels: list[Vessel],
    berths: list[Berth],
    cranes: list[Crane],
) -> dict[str, Any]:
    """
    Compute congestion metrics and score for a given set of vessels
    against the full (non-maintenance) berth/crane pool.
    """
    available_berths = [b for b in berths if b.status != "maintenance"]
    available_cranes = [c for c in cranes if c.status != "maintenance"]

    n_avail_berths = max(len(available_berths), 1)
    n_avail_cranes = max(len(available_cranes), 1)
    n_vessels      = len(vessels)

    if n_vessels == 0:
        return {
            "berth_utilization":  0.0,
            "crane_utilization":  0.0,
            "incoming_vessels":   0,
            "queue_estimate":     0,
            "congestion_score":   0.0,
            "risk_label":         "LOW",
        }

    # ── berth utilisation ─────────────────────────────────────────────────────
    # Greedy first-fit: simulate assigning each vessel to a free berth of
    # matching size in the same terminal.  Vessels that can't be assigned
    # become queue.
    free_berths: dict[str, list[Berth]] = {}
    for b in available_berths:
        free_berths.setdefault(b.terminal, []).append(b)

    assigned_count = 0
    queue_count    = 0

    for v in vessels:
        candidates = [
            b for b in free_berths.get(v.terminal, [])
            if _berth_fits(b, v.size)
        ]
        if candidates:
            # occupy the smallest adequate berth (best fit)
            candidates.sort(key=lambda b: SIZE_ORDER[b.max_vessel_size])
            chosen = candidates[0]
            free_berths[v.terminal].remove(chosen)
            assigned_count += 1
        else:
            queue_count += 1

    berth_util = min(assigned_count / n_avail_berths, 1.0)

    # ── crane utilisation ─────────────────────────────────────────────────────
    total_cranes_demanded = sum(_cranes_needed(v.size) for v in vessels)
    crane_util = min(total_cranes_demanded / n_avail_cranes, 1.0)

    # ── incoming pressure (proportion of window vessels vs berth capacity) ────
    incoming_ratio = min(n_vessels / n_avail_berths, 1.0)

    # ── queue ratio ───────────────────────────────────────────────────────────
    queue_ratio = queue_count / n_vessels if n_vessels else 0.0

    # ── weighted score ────────────────────────────────────────────────────────
    score = (
        W_BERTH    * berth_util    * 100
        + W_CRANE  * crane_util    * 100
        + W_INCOMING * incoming_ratio * 100
        + W_QUEUE  * queue_ratio   * 100
    )
    score = round(min(score, 100.0), 1)

    return {
        "berth_utilization":  round(berth_util  * 100, 1),
        "crane_utilization":  round(crane_util  * 100, 1),
        "incoming_vessels":   n_vessels,
        "queue_estimate":     queue_count,
        "congestion_score":   score,
        "risk_label":         _risk_label(score),
    }


# ── per-terminal scoring ──────────────────────────────────────────────────────

def _terminal_breakdown(
    vessels: list[Vessel],
    berths: list[Berth],
    cranes: list[Crane],
    terminals: list[str],
) -> list[dict[str, Any]]:
    result = []
    for t in sorted(terminals):
        t_vessels = [v for v in vessels if v.terminal == t]
        t_berths  = [b for b in berths  if b.terminal == t]
        t_cranes  = [c for c in cranes  if c.terminal == t]
        m = _score_window(t_vessels, t_berths, t_cranes)
        result.append({
            "terminal":          t,
            "vessel_count":      len(t_vessels),
            "berth_utilization": m["berth_utilization"],
            "crane_utilization": m["crane_utilization"],
            "queue_estimate":    m["queue_estimate"],
            "congestion_score":  m["congestion_score"],
            "risk_label":        m["risk_label"],
        })
    return result


# ── 72-hour forecast ──────────────────────────────────────────────────────────

def _forecast(
    all_vessels: list[Vessel],
    berths: list[Berth],
    cranes: list[Crane],
    now: datetime,
) -> list[dict[str, Any]]:
    windows = [
        ("NOW",  now,             now + timedelta(hours=8)),
        ("24H",  now,             now + timedelta(hours=24)),
        ("48H",  now + timedelta(hours=24), now + timedelta(hours=48)),
        ("72H",  now + timedelta(hours=48), now + timedelta(hours=72)),
    ]
    result = []
    for label, w_start, w_end in windows:
        bucket = [
            v for v in all_vessels
            if w_start <= v.eta < w_end
        ]
        m = _score_window(bucket, berths, cranes)
        result.append({
            "window":           label,
            "window_start":     w_start.isoformat(),
            "window_end":       w_end.isoformat(),
            "vessel_count":     len(bucket),
            "congestion_score": m["congestion_score"],
            "risk_label":       m["risk_label"],
        })
    return result


# ── list-based entry point (used by simulator — no DB writes) ────────────────

def calculate_congestion_from_lists(
    port: Port,
    berths: list[Berth],
    cranes: list[Crane],
    vessels: list[Vessel],
) -> dict[str, Any]:
    """
    Pure-function variant: accepts pre-built ORM lists instead of fetching
    from the DB. Used by the scenario simulator so asset status can be
    modified in-memory without persisting to the DB.
    """
    now = datetime.utcnow()

    peak_metrics: dict[str, Any] = {}
    peak_score = -1.0
    for step in range(0, 72, 4):
        w_start = now + timedelta(hours=step)
        w_end   = w_start + timedelta(hours=8)
        bucket  = [v for v in vessels if w_start <= v.eta < w_end]
        if not bucket:
            continue
        m = _score_window(bucket, berths, cranes)
        if m["congestion_score"] > peak_score:
            peak_score = m["congestion_score"]
            peak_metrics = dict(m)
            peak_metrics["window_start"] = w_start.isoformat()
            peak_metrics["window_end"]   = w_end.isoformat()

    if not peak_metrics:
        peak_metrics = _score_window([], berths, cranes)
        peak_metrics["window_start"] = now.isoformat()
        peak_metrics["window_end"]   = (now + timedelta(hours=8)).isoformat()

    incoming_8h = [v for v in vessels if now <= v.eta < now + timedelta(hours=8)]
    terminals   = list({v.terminal for v in vessels})

    return {
        "port_id":    port.id,
        "port_name":  port.name,
        "computed_at": now.isoformat(),
        "overall": {
            "congestion_score":  peak_metrics["congestion_score"],
            "risk_label":        peak_metrics["risk_label"],
            "peak_window_start": peak_metrics["window_start"],
            "peak_window_end":   peak_metrics["window_end"],
        },
        "raw_metrics": {
            "berth_utilization_pct":     peak_metrics["berth_utilization"],
            "crane_utilization_pct":     peak_metrics["crane_utilization"],
            "total_vessels_in_schedule": len(vessels),
            "incoming_next_8h":          len(incoming_8h),
            "queue_estimate":            peak_metrics["queue_estimate"],
            "available_berths":          len([b for b in berths if b.status != "maintenance"]),
            "available_cranes":          len([c for c in cranes if c.status != "maintenance"]),
        },
        "forecast":           _forecast(vessels, berths, cranes, now),
        "terminal_breakdown": _terminal_breakdown(vessels, berths, cranes, terminals),
    }


# ── public entry point ────────────────────────────────────────────────────────

def calculate_congestion(port_id: int, db: Session) -> dict[str, Any]:
    """
    Compute full congestion analysis for the given port.
    Raises ValueError if port not found.

    "Overall" score = peak 8-hour sliding-window score across the 72-hour
    horizon, so it reflects the busiest imminent period rather than the
    cumulative weight of all schedule vessels at once.
    """
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise ValueError(f"Port {port_id} not found")

    berths  = db.query(Berth).filter(Berth.port_id == port_id).all()
    cranes  = db.query(Crane).filter(Crane.port_id == port_id).all()
    vessels = db.query(Vessel).filter(Vessel.port_id == port_id).all()

    now = datetime.utcnow()

    # ── find peak 8-hour window (slide in 4-hour steps across 72 h) ──────────
    peak_metrics: dict[str, Any] = {}
    peak_score = -1.0
    for step in range(0, 72, 4):
        w_start = now + timedelta(hours=step)
        w_end   = w_start + timedelta(hours=8)
        bucket  = [v for v in vessels if w_start <= v.eta < w_end]
        if not bucket:
            continue
        m = _score_window(bucket, berths, cranes)
        if m["congestion_score"] > peak_score:
            peak_score = m["congestion_score"]
            peak_metrics = dict(m)
            peak_metrics["window_start"] = w_start.isoformat()
            peak_metrics["window_end"]   = w_end.isoformat()

    if not peak_metrics:
        peak_metrics = _score_window([], berths, cranes)
        peak_metrics["window_start"] = now.isoformat()
        peak_metrics["window_end"]   = (now + timedelta(hours=8)).isoformat()

    # ── incoming count: actual next-8h from now ───────────────────────────────
    incoming_8h = [v for v in vessels if now <= v.eta < now + timedelta(hours=8)]

    # ── terminals present in the full schedule ────────────────────────────────
    terminals = list({v.terminal for v in vessels})

    return {
        "port_id":    port_id,
        "port_name":  port.name,
        "computed_at": now.isoformat(),
        "overall": {
            "congestion_score":  peak_metrics["congestion_score"],
            "risk_label":        peak_metrics["risk_label"],
            "peak_window_start": peak_metrics["window_start"],
            "peak_window_end":   peak_metrics["window_end"],
        },
        "raw_metrics": {
            "berth_utilization_pct":     peak_metrics["berth_utilization"],
            "crane_utilization_pct":     peak_metrics["crane_utilization"],
            "total_vessels_in_schedule": len(vessels),
            "incoming_next_8h":          len(incoming_8h),
            "queue_estimate":            peak_metrics["queue_estimate"],
            "available_berths":          len([b for b in berths if b.status != "maintenance"]),
            "available_cranes":          len([c for c in cranes if c.status != "maintenance"]),
        },
        "forecast":           _forecast(vessels, berths, cranes, now),
        "terminal_breakdown": _terminal_breakdown(vessels, berths, cranes, terminals),
    }
