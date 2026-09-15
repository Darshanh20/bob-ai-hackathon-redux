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

- **Schedule ingestion:** Upload and validate vessel schedules with ETA, ETD, container, size, priority, and terminal data.
- **72-hour forecasting:** Calculate terminal congestion, queue pressure, utilization, and risk levels across rolling time windows.
- **Dispatch optimization:** Create priority-aware berth assignments and distribute cranes, with comparison against first-come-first-served scheduling.
- **What-if simulation:** Model berth or crane outages and compare congestion, queues, wait times, and reassignments before and after the disruption.
- **AI operations copilot:** Ask about vessel risk, terminal status, forecasts, and recommendations or generate a 72-hour operations report.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, TypeScript |
| **Frameworks** | FastAPI, React 18, Tailwind CSS |
| **IBM Technologies** | IBM Bob |
| **Databases** | SQLite via SQLAlchemy |
| **Other** | Uvicorn, pandas, Google Gemini API, python-dotenv, browser localStorage |

---

## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. From the repository root, install backend dependencies
cd src/portai/backend
pip install -r requirements.txt

# 2. Seed the local demo database
python -m app.services.seed_data

# 3. Start the backend
uvicorn app.main:app --reload --port 8000

# 4. In a second terminal, install and start the frontend
cd src/portai/frontend
npm install
npm start
```

The frontend is available at `http://localhost:3000`. The backend health check is `http://localhost:8000/health`. A Gemini API key is optional; without one, the copilot uses deterministic database-derived fallback responses.

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | No published demo video link is available; see [demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | No deployed live demo is available; see [demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- Team and submission metadata are not yet filled in.
- SQLite is intended for local demonstration and is not configured for concurrent production deployment.
- The optimizer is a synchronous greedy heuristic rather than a formal mathematical optimization solver.
- Authentication and authorization are not implemented, and CORS is limited to `http://localhost:3000`.
- Gemini features depend on an API key and network access, although deterministic fallbacks are available.
- No automated project test suite or completed hosted demo artifacts are included.

---

## 🏅 What We're Most Proud Of

PORTAI's strongest aspect is its end-to-end operational workflow: schedule ingestion, explainable congestion scoring, priority-aware berth and crane dispatch, disruption simulation, and AI-assisted reporting are connected in one usable dashboard. The simulator is especially useful because it evaluates outage impact on cloned in-memory state without modifying the persisted schedule.

---
