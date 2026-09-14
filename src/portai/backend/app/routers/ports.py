"""
routers/ports.py

GET  /ports/{port_id}                      – port config with nested berths & cranes
POST /ports/{port_id}/vessels/upload       – CSV upload; replaces vessels for that port
GET  /ports/{port_id}/vessels              – all vessels for a port as JSON
GET  /ports/{port_id}/congestion           – congestion score, forecast, terminal breakdown
GET  /ports/{port_id}/optimize             – berth + crane optimisation plan
POST /ports/{port_id}/copilot/ask          – AI copilot freeform Q&A
GET  /ports/{port_id}/report               – structured 72-hour operations report
GET  /ports/{port_id}/copilot/explain/{t}  – AI explanation for a terminal's risk
"""

import io
from datetime import datetime
from typing import Any

import pandas as pd
from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Berth, Crane, Port, Vessel
from ..services.congestion_engine import calculate_congestion
from ..services.optimizer import optimize_berths, optimize_cranes
from ..services.ai_copilot import (
    ask_copilot,
    build_context,
    explain_terminal,
    generate_report,
)
from ..services.simulate import run_simulation

router = APIRouter(prefix="/ports", tags=["ports"])

# ── required CSV columns ──────────────────────────────────────────────────────
REQUIRED_COLS = {"Vessel ID", "ETA", "ETD", "Containers", "Size", "Priority", "Terminal"}

VALID_SIZES = {"small", "medium", "large"}
VALID_PRIOS = {"normal", "high", "urgent"}


# ── helpers ───────────────────────────────────────────────────────────────────

def _port_or_404(port_id: int, db: Session) -> Port:
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail=f"Port {port_id} not found")
    return port


def _berth_to_dict(b: Berth, occupied_codes: set[str] | None = None) -> dict:
    status = b.status
    if status == "available" and occupied_codes and b.berth_code in occupied_codes:
        status = "occupied"
    return {
        "id":              b.id,
        "berth_code":      b.berth_code,
        "terminal":        b.terminal,
        "max_vessel_size": b.max_vessel_size,
        "status":          status,
        "capacity_teu":    b.capacity_teu,
    }


def _crane_to_dict(c: Crane) -> dict:
    return {
        "id":                       c.id,
        "crane_code":               c.crane_code,
        "terminal":                 c.terminal,
        "capacity_moves_per_hour":  c.capacity_moves_per_hour,
        "status":                   c.status,
    }


def _vessel_to_dict(v: Vessel) -> dict:
    return {
        "id":                v.id,
        "vessel_code":       v.vessel_code,
        "eta":               v.eta.isoformat(),
        "etd":               v.etd.isoformat(),
        "containers":        v.containers,
        "size":              v.size,
        "priority":          v.priority,
        "terminal":          v.terminal,
        "assigned_berth_id": v.assigned_berth_id,
        "assigned_cranes":   v.get_assigned_cranes(),
    }


# ── 1. GET /ports/{port_id} ───────────────────────────────────────────────────

@router.get("/{port_id}")
def get_port(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    port = _port_or_404(port_id, db)
    occupied: set[str] = set()
    try:
        berth_plan = optimize_berths(port_id, db)
        assignments = berth_plan.get("assignments", [])
        if assignments:
            now_dt = datetime.utcnow()
            for a in assignments:
                start = datetime.fromisoformat(a["scheduled_start"])
                end = start + pd.Timedelta(hours=a.get("service_hours", 4)).to_pytimedelta()
                if start <= now_dt < end:
                    occupied.add(a["berth_code"])
            # If current real clock is outside window, display first active wave
            if not occupied:
                earliest = min(datetime.fromisoformat(a["scheduled_start"]) for a in assignments)
                for a in assignments:
                    start = datetime.fromisoformat(a["scheduled_start"])
                    if start <= earliest + pd.Timedelta(hours=4).to_pytimedelta():
                        occupied.add(a["berth_code"])
    except Exception:
        occupied = set()

    return {
        "id":            port.id,
        "name":          port.name,
        "terminals":     port.terminals,
        "berths":        port.berths,
        "cranes":        port.cranes,
        "yard_capacity": port.yard_capacity,
        "berth_records": [_berth_to_dict(b, occupied) for b in port.berth_records],
        "crane_records": [_crane_to_dict(c) for c in port.crane_records],
    }


# ── 1b. POST /ports/{port_id}/reseed ─────────────────────────────────────────

@router.post("/{port_id}/reseed")
def reseed_port(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _port_or_404(port_id, db)
    from ..services.seed_data import seed
    seed()
    return {"message": "Port database re-seeded successfully with fresh 72h schedule", "port_id": port_id}


# ── 2. POST /ports/{port_id}/vessels/upload ───────────────────────────────────

@router.post("/{port_id}/vessels/upload")
async def upload_vessels(
    port_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:

    port = _port_or_404(port_id, db)

    # ── read bytes ────────────────────────────────────────────────────────────
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # ── parse CSV ─────────────────────────────────────────────────────────────
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    # ── validate columns ──────────────────────────────────────────────────────
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {sorted(missing)}",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV has no data rows")

    # ── validate & coerce dates ───────────────────────────────────────────────
    for col in ("ETA", "ETD"):
        try:
            df[col] = pd.to_datetime(df[col], format="%Y-%m-%d %H:%M")
        except Exception:
            try:
                df[col] = pd.to_datetime(df[col], infer_datetime_format=True)
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Column '{col}' contains unparseable dates: {exc}",
                ) from exc

    # ── validate enums ────────────────────────────────────────────────────────
    bad_sizes = set(df["Size"].str.lower().unique()) - VALID_SIZES
    if bad_sizes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Size values: {sorted(bad_sizes)}. Allowed: {sorted(VALID_SIZES)}",
        )

    bad_prios = set(df["Priority"].str.lower().unique()) - VALID_PRIOS
    if bad_prios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Priority values: {sorted(bad_prios)}. Allowed: {sorted(VALID_PRIOS)}",
        )

    # ── replace vessels for this port ─────────────────────────────────────────
    db.query(Vessel).filter(Vessel.port_id == port_id).delete()

    vessels: list[Vessel] = []
    for _, row in df.iterrows():
        v = Vessel(
            port_id     = port_id,
            vessel_code = str(row["Vessel ID"]).strip(),
            eta         = row["ETA"].to_pydatetime(),
            etd         = row["ETD"].to_pydatetime(),
            containers  = int(row["Containers"]),
            size        = str(row["Size"]).strip().lower(),
            priority    = str(row["Priority"]).strip().lower(),
            terminal    = str(row["Terminal"]).strip(),
        )
        vessels.append(v)
        db.add(v)

    db.commit()

    # ── build summary ─────────────────────────────────────────────────────────
    etas = df["ETA"]
    return {
        "message":           "Vessel schedule uploaded successfully",
        "port_id":           port_id,
        "port_name":         port.name,
        "vessels_imported":  len(vessels),
        "eta_range": {
            "earliest": etas.min().isoformat(),
            "latest":   etas.max().isoformat(),
        },
        "terminals_covered": sorted(df["Terminal"].str.strip().unique().tolist()),
        "priority_breakdown": df["Priority"].str.lower().value_counts().to_dict(),
        "size_breakdown":     df["Size"].str.lower().value_counts().to_dict(),
    }


# ── 3. GET /ports/{port_id}/vessels ───────────────────────────────────────────

@router.get("/{port_id}/vessels")
def get_vessels(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _port_or_404(port_id, db)
    vessels = (
        db.query(Vessel)
        .filter(Vessel.port_id == port_id)
        .order_by(Vessel.eta)
        .all()
    )
    return {
        "port_id": port_id,
        "count":   len(vessels),
        "vessels": [_vessel_to_dict(v) for v in vessels],
    }


# ── 4. GET /ports/{port_id}/congestion ────────────────────────────────────────

@router.get("/{port_id}/congestion")
def get_congestion(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _port_or_404(port_id, db)
    try:
        return calculate_congestion(port_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ── 5. GET /ports/{port_id}/optimize ─────────────────────────────────────────

@router.get("/{port_id}/optimize")
def get_optimize(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _port_or_404(port_id, db)
    try:
        berth_plan = optimize_berths(port_id, db)
        crane_plan = optimize_cranes(port_id, db, berth_plan["assignments"])
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "port_id": port_id,
        "berth_plan": berth_plan,
        "crane_plan": crane_plan,
        "summary": {
            "total_vessels":       berth_plan["total_vessels"],
            "vessels_assigned":    berth_plan["vessels_assigned"],
            "conflicts_resolved":  berth_plan["conflicts_resolved"],
            "recommended_moves":   len(berth_plan["recommended_moves"]),
            "avg_wait_before_h":   berth_plan["avg_wait_before_h"],
            "avg_wait_after_h":    berth_plan["avg_wait_after_h"],
            "improvement_percent": berth_plan["improvement_percent"],
        },
    }


# ── 6. POST /ports/{port_id}/copilot/ask ─────────────────────────────────────

@router.post("/{port_id}/copilot/ask")
def copilot_ask(
    port_id: int,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _port_or_404(port_id, db)
    question = (body.get("question") or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Field 'question' is required")
    try:
        answer = ask_copilot(port_id, db, question)
    except RuntimeError as exc:          # missing API key
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"port_id": port_id, "question": question, "answer": answer}


# ── 7. GET /ports/{port_id}/report ───────────────────────────────────────────

@router.get("/{port_id}/report")
def get_report(port_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _port_or_404(port_id, db)
    try:
        return generate_report(port_id, db)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


# ── 8. GET /ports/{port_id}/copilot/explain/{terminal} ───────────────────────

@router.get("/{port_id}/copilot/explain/{terminal}")
def copilot_explain(
    port_id: int,
    terminal: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _port_or_404(port_id, db)
    try:
        explanation = explain_terminal(port_id, terminal.upper(), db)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"port_id": port_id, "terminal": terminal.upper(), "explanation": explanation}


# ── 9. POST /ports/{port_id}/simulate ────────────────────────────────────────

@router.post("/{port_id}/simulate")
def simulate_scenario(
    port_id: int,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _port_or_404(port_id, db)

    sim_type  = body.get("type", "").strip()
    target_id = body.get("target_id")

    if sim_type not in ("berth_unavailable", "crane_unavailable"):
        raise HTTPException(
            status_code=400,
            detail="'type' must be 'berth_unavailable' or 'crane_unavailable'",
        )
    if not isinstance(target_id, int):
        raise HTTPException(status_code=400, detail="'target_id' must be an integer")

    try:
        return run_simulation(port_id, sim_type, target_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
