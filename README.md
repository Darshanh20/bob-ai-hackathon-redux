# 🚀 PORTAI — Autonomous Port Congestion Predictor & Shift Planner

> PORTAI helps port operations teams predict congestion, optimize berth and crane assignments, and test disruption scenarios from one operational dashboard.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Redux |
| **Track** | AI |
| **Team Lead** | Om Chauhan |
| **Members** | Darshan Hotchandani, Shreya Patel, Ansh Patel |

---

## 🎯 Problem Statement

Port dispatch and operations teams must coordinate vessel arrivals, berth capacity, crane availability, and cargo priority while conditions change throughout the day. Spreadsheet-based and first-come-first-served workflows make congestion, vessel risk, and the impact of equipment outages difficult to see early enough to act.

---

## 💡 Solution

PORTAI ingests vessel schedules, calculates explainable terminal congestion and risk, forecasts conditions across the next 72 hours, and recommends berth and crane allocations. Its what-if simulator tests berth or crane outages without changing persisted data, while an AI copilot answers operational questions and generates a structured report.

---

## ✨ Key Features


- **Schedule ingestion:** Upload and validate vessel schedules (CSV) with ETA, ETD, container count, size, priority, and terminal data. A built-in sample CSV is available to download from the UI.
- **72-hour forecasting:** Calculate terminal congestion, queue pressure, utilization, and risk levels across rolling time windows.
- **Dispatch optimization:** Create priority-aware berth assignments and distribute cranes, with comparison against first-come-first-served scheduling.
- **What-if simulation:** Model berth or crane outages and compare congestion, queues, wait times, and reassignments before and after the disruption, on cloned in-memory state only — no persisted data is modified.
- **AI operations copilot:** Ask about vessel risk, terminal status, forecasts, and recommendations or generate a structured 72-hour operations report. Falls back to deterministic database-derived responses if no API key is configured.
- **Reseed endpoint:** `POST /ports/{port_id}/reseed` regenerates the full demo dataset at any time without restarting the server.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python 3.14, TypeScript |
| **Frameworks** | FastAPI 0.111, React 18, Tailwind CSS 3 |
| **IBM Technologies** | IBM Bob |
| **Databases** | SQLite (via SQLAlchemy 2.0) |
| **AI / LLM** | Anthropic Claude API (copilot), Google Gemini API (optional) |
| **Other** | Uvicorn, pandas, python-dotenv, browser localStorage |

---

## 📁 Repository Structure

```
├── src/
│   └── portai/
│       ├── backend/              # FastAPI application
│       │   ├── app/
│       │   │   ├── main.py       # FastAPI entry point & CORS setup
│       │   │   ├── database.py   # SQLAlchemy engine & session (SQLite)
│       │   │   ├── models.py     # ORM models: Port, Berth, Crane, Vessel
│       │   │   ├── routers/
│       │   │   │   └── ports.py  # All REST endpoints
│       │   │   └── services/
│       │   │       ├── seed_data.py          # Demo dataset generator
│       │   │       ├── congestion_engine.py  # 72-h congestion scoring
│       │   │       ├── optimizer.py          # Berth & crane allocation
│       │   │       ├── simulate.py           # What-if outage simulation
│       │   │       ├── ai_copilot.py         # Copilot / report service
│       │   │       └── export_csv.py         # CSV export helper
│       │   ├── portai.db         # SQLite database (auto-created)
│       │   ├── requirements.txt
│       │   └── .env.example
│       └── frontend/             # React + TypeScript UI
│           ├── src/
│           ├── package.json
│           └── .env.example
├── demo/                         # Demo artifacts
│   ├── screenshots/
│   └── demo-video-link.txt
├── presentation/                 # Slide deck
└── submission.yaml               # Structured submission metadata
```

---

## ⚡ How to Run

### Prerequisites

- **Python 3.12+** (project developed and tested on Python 3.14)
- **Node.js 18+** and **npm 9+**
- A virtual environment is included at `src/portai/backend/venv/`

### 1 — Backend environment variables

```bash
cp src/portai/backend/.env.example src/portai/backend/.env
```

Edit `src/portai/backend/.env` and add your Anthropic API key (required for the AI copilot and report features):

```
ANTHROPIC_API_KEY=sk-ant-...
```

> Without a key the server still starts and all non-AI endpoints work normally. Copilot and report endpoints return deterministic fallback responses instead.

### 2 — Install backend dependencies

```bash
cd src/portai/backend
pip install -r requirements.txt
```

> **Python 3.14 note:** SQLAlchemy 2.0.30 (pinned in `requirements.txt`) is incompatible with Python 3.14 due to a `FastIntFlag` regression. If you are on Python 3.14, upgrade SQLAlchemy after the standard install:
> ```bash
> pip install "sqlalchemy>=2.0.36"
> ```

### 3 — Seed the local demo database

Run from the `src/portai/backend/` directory:

```bash
python -m app.services.seed_data
```

Expected output:

```
====================================================
  portai seed complete
====================================================
  Ports   : 1
  Berths  : 12  (2 in maintenance)
  Cranes  : 25  (2 in maintenance)
  Vessels : 45
```

### 4 — Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Interactive docs: `http://localhost:8000/docs`

### 5 — Frontend environment variables (optional)

```bash
cp src/portai/frontend/.env.example src/portai/frontend/.env
```

The default value `REACT_APP_PUBLIC_API_URL=http://localhost:8000` works for local development. The frontend `package.json` also sets a `"proxy": "http://localhost:8000"` so this step is optional unless you change the backend port.

### 6 — Install and start the frontend

In a **second terminal**:

```bash
cd src/portai/frontend
npm install
npm start
```

The app opens at **http://localhost:3000**.

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/ports/{id}` | Port config with nested berths & cranes |
| `POST` | `/ports/{id}/reseed` | Re-generate the full demo dataset |
| `POST` | `/ports/{id}/vessels/upload` | Replace vessel schedule from CSV upload |
| `DELETE` | `/ports/{id}/vessels` | Clear all vessels for a port |
| `GET` | `/ports/{id}/sample-csv` | Download a sample vessel schedule CSV |
| `GET` | `/ports/{id}/vessels` | List all vessels ordered by ETA |
| `GET` | `/ports/{id}/congestion` | 72-hour congestion scores and forecasts |
| `GET` | `/ports/{id}/optimize` | Priority-aware berth & crane plan |
| `POST` | `/ports/{id}/simulate` | What-if outage simulation |
| `POST` | `/ports/{id}/copilot/ask` | AI copilot freeform Q&A |
| `GET` | `/ports/{id}/report` | Structured 72-hour operations report |
| `GET` | `/ports/{id}/copilot/explain/{terminal}` | AI explanation for a terminal's risk |

### CSV upload format

Required columns: `Vessel ID`, `ETA`, `ETD`, `Containers`, `Size`, `Priority`, `Terminal`

| Column | Format / Values |
|---|---|
| `ETA` / `ETD` | `YYYY-MM-DD HH:MM` (ISO 8601 also accepted) |
| `Size` | `small` · `medium` · `large` |
| `Priority` | `normal` · `high` · `urgent` |

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [presentation/](presentation/) |

---

## ⚠️ Known Limitations

- SQLite is intended for local demonstration; it is not configured for concurrent production deployment.
- The optimizer is a synchronous greedy heuristic rather than a formal mathematical optimization solver.
- Authentication and authorization are not implemented; CORS is restricted to `http://localhost:3000`.
- Copilot and report features require an Anthropic API key and network access; deterministic fallbacks are available for copilot Q&A only.
- `datetime.utcnow()` in `seed_data.py` will produce a deprecation warning on Python 3.14+ (harmless; does not affect functionality).
- No automated test suite is included.

---

## 🏅 What We're Most Proud Of

PORTAI's strongest aspect is its end-to-end operational workflow: schedule ingestion, explainable congestion scoring, priority-aware berth and crane dispatch, disruption simulation, and AI-assisted reporting are connected in one usable dashboard. The simulator is especially useful because it evaluates outage impact on cloned in-memory state without modifying the persisted schedule.
