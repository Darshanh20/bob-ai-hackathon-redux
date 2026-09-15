"""
run_tests.py
============
Comprehensive API test suite for PORTAI.
Uploads PORTAI_Vessel_Arrivals_Test.csv, then exercises every endpoint.

Usage (from src/portai/backend/):
    python run_tests.py
"""

import json
import sys
import os
import io
import traceback

# Force UTF-8 on Windows console to avoid cp1252 encode errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ── use the venv's requests if available ──────────────────────────────────────
try:
    import requests
except ImportError:
    print("ERROR: 'requests' not available. Install it: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost:8000"
PORT_ID  = 1
CSV_PATH = os.path.join(os.path.dirname(__file__), "PORTAI_Vessel_Arrivals_Test.csv")

# ── plain ASCII helpers (no ANSI, safe on all Windows terminals) ──────────────
GREEN  = ""
RED    = ""
YELLOW = ""
CYAN   = ""
RESET  = ""
BOLD   = ""

PASS_MARK = "[PASS]"
FAIL_MARK = "[FAIL]"
SEP       = "-" * 60

results = []   # list of (name, passed, detail)


def ok(name: str, detail: str = ""):
    results.append((name, True, detail))
    print(f"  {PASS_MARK} {name}" + (f"  -- {detail}" if detail else ""))


def fail(name: str, detail: str = ""):
    results.append((name, False, detail))
    print(f"  {FAIL_MARK} {name}  -- {detail}")


def section(title: str):
    print(f"\n{SEP}")
    print(f"  {title}")
    print(f"{SEP}")


def check(name: str, resp, *, expected_status=200, required_keys: list = None, check_fn=None):
    """Generic response checker."""
    try:
        if resp.status_code != expected_status:
            fail(name, f"HTTP {resp.status_code} (expected {expected_status}): {resp.text[:200]}")
            return None
        data = resp.json()
        if required_keys:
            missing = [k for k in required_keys if k not in data]
            if missing:
                fail(name, f"Missing keys: {missing}")
                return data
        if check_fn:
            msg = check_fn(data)
            if msg:
                fail(name, msg)
                return data
        ok(name)
        return data
    except Exception as exc:
        fail(name, f"Exception: {exc}\n{traceback.format_exc()}")
        return None


# ══════════════════════════════════════════════════════════════════════════════
# STEP 0 -- health check
# ══════════════════════════════════════════════════════════════════════════════
section("0. Health check")
try:
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    check("GET /health", r, required_keys=["status"],
          check_fn=lambda d: None if d.get("status") == "ok" else f"status={d.get('status')}")
except requests.ConnectionError:
    fail("GET /health", "Cannot connect to backend -- is uvicorn running on port 8000?")
    print(f"\n{RED}Backend is not reachable. Start it first:{RESET}")
    print("  cd src/portai/backend")
    print("  venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 -- reseed (fresh demo data baseline)
# ══════════════════════════════════════════════════════════════════════════════
section("1. Reseed demo database")
r = requests.post(f"{BASE_URL}/ports/{PORT_ID}/reseed", timeout=15)
check("POST /ports/1/reseed", r, required_keys=["message"])


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 -- GET port config
# ══════════════════════════════════════════════════════════════════════════════
section("2. Port configuration")
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}", timeout=10)
port_data = check("GET /ports/1", r,
    required_keys=["id", "name", "terminals", "berths", "cranes",
                   "berth_records", "crane_records"],
    check_fn=lambda d: None if d.get("berths", 0) > 0 else "No berths returned")

if port_data:
    ok("Port has berths", f"{port_data['berths']} berths, {port_data['cranes']} cranes, {port_data['terminals']} terminals")
    berth_ids  = [b["id"]  for b in port_data.get("berth_records", [])]
    crane_ids  = [c["id"]  for c in port_data.get("crane_records", [])]
else:
    berth_ids, crane_ids = [], []

# 404 check
r404 = requests.get(f"{BASE_URL}/ports/9999", timeout=5)
check("GET /ports/9999 -> 404", r404, expected_status=404)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 -- CSV upload
# ══════════════════════════════════════════════════════════════════════════════
section("3. CSV vessel schedule upload")

# 3a. valid upload
with open(CSV_PATH, "rb") as f:
    r = requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
        files={"file": ("PORTAI_Vessel_Arrivals_Test.csv", f, "text/csv")},
        timeout=15,
    )
upload_data = check("POST /ports/1/vessels/upload (valid CSV)", r,
    required_keys=["vessels_imported", "port_id", "terminals_covered",
                   "priority_breakdown", "size_breakdown"],
    check_fn=lambda d: None if d.get("vessels_imported") == 19
                       else f"Expected 19 vessels, got {d.get('vessels_imported')}")

if upload_data:
    ok("Upload terminals", f"Covered: {upload_data.get('terminals_covered')}")
    ok("Upload priorities", str(upload_data.get("priority_breakdown")))
    ok("Upload sizes", str(upload_data.get("size_breakdown")))

# 3b. empty file
r_empty = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
    files={"file": ("empty.csv", b"", "text/csv")},
    timeout=10,
)
check("POST upload empty file -> 400", r_empty, expected_status=400)

# 3c. missing columns
bad_csv = b"VesselID,ArrivalTime\nABC,2026-01-01"
r_bad = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
    files={"file": ("bad.csv", bad_csv, "text/csv")},
    timeout=10,
)
check("POST upload missing columns -> 400", r_bad, expected_status=400)

# 3d. invalid Size enum
bad_size_csv = b"Vessel ID,ETA,ETD,Containers,Size,Priority,Terminal\nTEST-1,2026-09-15 08:00,2026-09-15 16:00,100,JUMBO,normal,T1"
r_bads = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
    files={"file": ("badsize.csv", bad_size_csv, "text/csv")},
    timeout=10,
)
check("POST upload invalid Size -> 400", r_bads, expected_status=400)

# 3e. invalid Priority enum
bad_prio_csv = b"Vessel ID,ETA,ETD,Containers,Size,Priority,Terminal\nTEST-1,2026-09-15 08:00,2026-09-15 16:00,100,large,VIP,T1"
r_badp = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
    files={"file": ("badprio.csv", bad_prio_csv, "text/csv")},
    timeout=10,
)
check("POST upload invalid Priority -> 400", r_badp, expected_status=400)

# Re-upload test CSV to ensure it's loaded for subsequent tests
with open(CSV_PATH, "rb") as f:
    requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
        files={"file": ("PORTAI_Vessel_Arrivals_Test.csv", f, "text/csv")},
        timeout=15,
    )


# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 -- GET vessels
# ══════════════════════════════════════════════════════════════════════════════
section("4. Vessel list")
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/vessels", timeout=10)
vessels_data = check("GET /ports/1/vessels", r,
    required_keys=["port_id", "count", "vessels"],
    check_fn=lambda d: None if d.get("count") == 19
                       else f"Expected 19 vessels, got {d.get('count')}")

vessel_ids = []
if vessels_data:
    vessel_ids = [v["id"] for v in vessels_data["vessels"]]
    # Check ETA ordering
    etas = [v["eta"] for v in vessels_data["vessels"]]
    if etas == sorted(etas):
        ok("Vessels ordered by ETA")
    else:
        fail("Vessels ordered by ETA", "ETAs are not in ascending order")

    # Spot-check first vessel
    first = vessels_data["vessels"][0]
    if first["vessel_code"] == "MAERSK-ALPHA" and first["priority"] == "urgent":
        ok("First vessel is MAERSK-ALPHA (urgent)")
    else:
        fail("First vessel check", f"Got {first.get('vessel_code')}/{first.get('priority')}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 -- congestion engine
# ══════════════════════════════════════════════════════════════════════════════
section("5. Congestion engine")
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/congestion", timeout=10)
cong = check("GET /ports/1/congestion", r,
    required_keys=["overall", "raw_metrics", "forecast", "terminal_breakdown"],
    check_fn=lambda d: (
        None if (
            "congestion_score" in d["overall"]
            and "risk_label" in d["overall"]
            and len(d["forecast"]) == 4
        ) else "Missing sub-keys"
    ))

if cong:
    overall = cong["overall"]
    raw     = cong["raw_metrics"]
    ok("Overall score present",
       f"score={overall['congestion_score']}/100  risk={overall['risk_label']}")
    ok("Forecast windows",
       f"{[w['window'] for w in cong['forecast']]}")

    tb = cong["terminal_breakdown"]
    terminals_in_data = {t["terminal"] for t in tb}
    if terminals_in_data == {"T1","T2","T3"}:
        ok("Terminal breakdown covers T1/T2/T3")
    else:
        fail("Terminal breakdown", f"Expected {{T1,T2,T3}}, got {terminals_in_data}")

    # All scores should be 0-100
    for t in tb:
        sc = t["congestion_score"]
        if not (0 <= sc <= 100):
            fail(f"Terminal {t['terminal']} score range", f"score={sc}")
        else:
            ok(f"Terminal {t['terminal']} score range", f"score={sc}  risk={t['risk_label']}")

    # Vessels in raw_metrics should be 19
    if raw.get("total_vessels_in_schedule") == 19:
        ok("Raw metrics vessel count == 19")
    else:
        fail("Raw metrics vessel count", f"Got {raw.get('total_vessels_in_schedule')}")

# Bad port id
r404 = requests.get(f"{BASE_URL}/ports/9999/congestion", timeout=5)
check("GET /ports/9999/congestion -> 404", r404, expected_status=404)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 6 -- optimizer
# ══════════════════════════════════════════════════════════════════════════════
section("6. Berth & crane optimizer")
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/optimize", timeout=15)
opt = check("GET /ports/1/optimize", r,
    required_keys=["port_id", "berth_plan", "crane_plan", "summary"])

if opt:
    bp = opt["berth_plan"]
    cp = opt["crane_plan"]
    s  = opt["summary"]

    if bp.get("total_vessels") == 19:
        ok("Optimizer: total_vessels == 19")
    else:
        fail("Optimizer total vessels", f"Got {bp.get('total_vessels')}")

    assigned = bp.get("vessels_assigned", 0)
    if assigned > 0:
        ok("Optimizer: vessels assigned", f"{assigned}/{bp.get('total_vessels')}")
    else:
        fail("Optimizer: vessels assigned", "0 vessels assigned")

    imp = s.get("improvement_percent", 0)
    ok("Optimizer improvement", f"{imp}%  wait_before={s.get('avg_wait_before_h')}h  wait_after={s.get('avg_wait_after_h')}h")

    # Check crane plan structure
    if "terminal_summaries" in cp and len(cp["terminal_summaries"]) > 0:
        ok("Crane plan terminal summaries present", str(len(cp["terminal_summaries"])) + " terminals")
    else:
        fail("Crane plan terminal summaries", "Empty or missing")

    # Berth assignments -- check required fields
    if bp.get("assignments"):
        a0 = bp["assignments"][0]
        needed = ["vessel_code","berth_code","eta","wait_hours","service_hours","priority"]
        missing = [k for k in needed if k not in a0]
        if missing:
            fail("Assignment record keys", f"Missing: {missing}")
        else:
            ok("Assignment record structure OK", f"First: {a0['vessel_code']} -> {a0['berth_code']}")
    else:
        fail("Berth assignments", "No assignments returned")

    # Save IDs for simulation tests
    first_berth_id = berth_ids[0] if berth_ids else None
    first_crane_id = crane_ids[0] if crane_ids else None
else:
    first_berth_id = berth_ids[0] if berth_ids else None
    first_crane_id = crane_ids[0] if crane_ids else None


# ══════════════════════════════════════════════════════════════════════════════
# STEP 7 -- simulation
# ══════════════════════════════════════════════════════════════════════════════
section("7. What-if simulator")

if first_berth_id:
    r = requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/simulate",
        json={"type": "berth_unavailable", "target_id": first_berth_id},
        timeout=20,
    )
    sim = check(f"POST simulate berth_unavailable (id={first_berth_id})", r,
        required_keys=["before","after","delta","impact_summary"])
    if sim:
        ok("Simulation before/after scores",
           f"before={sim['before']['congestion_score']}  after={sim['after']['congestion_score']}")
        ok("Simulation impact summary", sim["impact_summary"][:120])
        ok("Delta keys present", str(list(sim["delta"].keys())))
else:
    fail("POST simulate berth_unavailable", "No berth_id available from port config")

if first_crane_id:
    r = requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/simulate",
        json={"type": "crane_unavailable", "target_id": first_crane_id},
        timeout=20,
    )
    check(f"POST simulate crane_unavailable (id={first_crane_id})", r,
        required_keys=["before","after","delta","impact_summary"])
else:
    fail("POST simulate crane_unavailable", "No crane_id available from port config")

# Invalid sim type
r_bad = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/simulate",
    json={"type": "explosion", "target_id": 1},
    timeout=5,
)
check("POST simulate invalid type -> 400", r_bad, expected_status=400)

# Missing target_id
r_noid = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/simulate",
    json={"type": "berth_unavailable", "target_id": "not-an-int"},
    timeout=5,
)
check("POST simulate non-int target_id -> 400", r_noid, expected_status=400)

# Non-existent berth id
r_noberth = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/simulate",
    json={"type": "berth_unavailable", "target_id": 99999},
    timeout=5,
)
check("POST simulate berth_id=99999 -> 404", r_noberth, expected_status=404)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 8 -- copilot Q&A
# ══════════════════════════════════════════════════════════════════════════════
section("8. AI Copilot Q&A")

questions = [
    ("What is the current risk level?",     ["risk", "port", "score"]),
    ("Which vessels have urgent priority?",  ["vessel", "urgent"]),
    ("What is the 72-hour forecast?",        ["congestion", "terminal"]),
    ("Recommend an operational strategy.",   ["wait", "berth"]),
    ("What is the status of terminal T1?",   ["T1", "congestion"]),
]

for question, expected_words in questions:
    r = requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/copilot/ask",
        json={"question": question},
        timeout=30,
    )
    data = check(f"POST copilot/ask: '{question[:45]}'", r,
        required_keys=["answer"],
        check_fn=lambda d: None if len(d.get("answer","")) > 20
                           else "Answer too short")
    if data:
        ans = data["answer"]
        # Check at least one expected word appears (case-insensitive)
        found = any(w.lower() in ans.lower() for w in expected_words)
        if found:
            ok(f"  Answer contains expected keywords", ans[:100])
        else:
            fail(f"  Answer missing keywords {expected_words}", ans[:100])

# Missing question field
r_noq = requests.post(
    f"{BASE_URL}/ports/{PORT_ID}/copilot/ask",
    json={},
    timeout=5,
)
check("POST copilot/ask empty body -> 400", r_noq, expected_status=400)


# ══════════════════════════════════════════════════════════════════════════════
# STEP 9 -- operations report
# ══════════════════════════════════════════════════════════════════════════════
section("9. 72-hour operations report")
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/report", timeout=30)
report = check("GET /ports/1/report", r,
    required_keys=["overall_risk","expected_vessels","high_risk_terminal",
                   "peak_congestion_window","key_risks","ai_recommendations",
                   "expected_impact"])
if report:
    ok("Report overall_risk",          report["overall_risk"])
    ok("Report expected_vessels",      str(report["expected_vessels"]))
    ok("Report high_risk_terminal",    report["high_risk_terminal"])
    ok("Report peak_window",           report["peak_congestion_window"])
    ok("Report key_risks count",       str(len(report["key_risks"])))
    ok("Report ai_recommendations",    str(len(report["ai_recommendations"])))
    ei = report.get("expected_impact", {})
    ok("Report expected_impact keys",  str(list(ei.keys())))


# ══════════════════════════════════════════════════════════════════════════════
# STEP 10 -- terminal explain
# ══════════════════════════════════════════════════════════════════════════════
section("10. Terminal risk explanation")
for terminal in ("T1", "T2", "T3"):
    r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/copilot/explain/{terminal}", timeout=30)
    check(f"GET copilot/explain/{terminal}", r,
        required_keys=["terminal","explanation"],
        check_fn=lambda d: None if len(d.get("explanation","")) > 20
                           else "Explanation too short")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 11 -- DELETE vessels then verify empty
# ══════════════════════════════════════════════════════════════════════════════
section("11. DELETE vessels")
r = requests.delete(f"{BASE_URL}/ports/{PORT_ID}/vessels", timeout=10)
del_data = check("DELETE /ports/1/vessels", r,
    required_keys=["deleted_count"],
    check_fn=lambda d: None if d.get("deleted_count") == 19
                       else f"Expected 19 deleted, got {d.get('deleted_count')}")

# Verify vessel list is now empty
r = requests.get(f"{BASE_URL}/ports/{PORT_ID}/vessels", timeout=10)
empty = check("GET /ports/1/vessels after delete", r,
    check_fn=lambda d: None if d.get("count") == 0 else f"Count={d.get('count')}, expected 0")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 12 -- restore test data
# ══════════════════════════════════════════════════════════════════════════════
section("12. Restore test CSV")
with open(CSV_PATH, "rb") as f:
    r = requests.post(
        f"{BASE_URL}/ports/{PORT_ID}/vessels/upload",
        files={"file": ("PORTAI_Vessel_Arrivals_Test.csv", f, "text/csv")},
        timeout=15,
    )
check("POST upload (restore)", r, required_keys=["vessels_imported"])


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
passed = sum(1 for _, p, _ in results if p)
failed = sum(1 for _, p, _ in results if not p)
total  = len(results)

print(f"\n{'='*60}")
print(f"  TEST SUMMARY")
print(f"{'='*60}")
print(f"  Total  : {total}")
print(f"  Passed : {passed}")
print(f"  Failed : {failed}")
print(f"{'='*60}")

if failed:
    print(f"\nFAILED TESTS:")
    for name, p, detail in results:
        if not p:
            print(f"  {FAIL_MARK} {name}")
            print(f"      {detail}")

print()
sys.exit(0 if failed == 0 else 1)
