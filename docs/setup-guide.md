# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [x] **Python 3.12+** (tested up to Python 3.14)
- [x] **Node.js 18+** and **npm 9+**
- [x] **Git**

---

## Environment Variables

### Backend Configuration

Copy `src/portai/backend/.env.example` to `src/portai/backend/.env`:

```bash
cp src/portai/backend/.env.example src/portai/backend/.env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for AI Copilot | Optional | `""` (Uses deterministic fallback) |
| `GEMINI_API_KEY` | Google Gemini API key for AI Copilot | Optional | `""` |
| `DATABASE_URL` | SQLite database file URI | Optional | `sqlite:///./portai.db` |

### Frontend Configuration (Optional)

Copy `src/portai/frontend/.env.example` to `src/portai/frontend/.env`:

```bash
cp src/portai/frontend/.env.example src/portai/frontend/.env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `REACT_APP_PUBLIC_API_URL` | Base URL of the FastAPI backend | Optional | `http://localhost:8000` |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Darshanh20/bob-ai-hackathon-redux.git
cd bob-ai-hackathon-redux
```

### 2. Set Up Backend Virtual Environment

```bash
cd src/portai/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

> **Python 3.14 note:** If using Python 3.14, ensure SQLAlchemy 2.0.36+ is installed:
> ```bash
> pip install "sqlalchemy>=2.0.36"
> ```

### 3. Seed the Initial Demo Database

Run from the `src/portai/backend` directory with the virtual environment activated:

```bash
python -m app.services.seed_data
```

Expected Output:
```text
====================================================
  portai seed complete
====================================================
  Ports   : 1
  Berths  : 16  (1 in maintenance)
  Cranes  : 28  (1 in maintenance)
  Vessels : 20
```

### 4. Install Frontend Dependencies

In a second terminal:

```bash
cd src/portai/frontend
npm install
```

---

## Running the Application

### 1. Start the Backend API Server

```bash
cd src/portai/backend
# Activate virtual environment if not already activated
venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

- **API Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### 2. Start the Frontend Development Server

In a second terminal:

```bash
cd src/portai/frontend
npm start
```

- **Frontend UI**: `http://localhost:3000`

---

## Running Tests & Verifications

### 1. Backend Automated Verification Suite

Run from `src/portai/backend`:

```bash
python run_tests.py
```

### 2. Frontend Production Build Verification

Run from `src/portai/frontend`:

```bash
npm run build
```

---

## Quick Demo Walkthrough

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **"Download Demo CSV"** or upload `src/portai/backend/PORTAI_Vessel_Arrivals_Test.csv` to launch the operations command center.
3. Observe the **0–100 Congestion Index** and the **72-Hour Horizon Forecast**.
4. Click **"Run Optimizer"** in the top bar to resolve the bottleneck and observe wait time drop by **~49.9%**.
5. Use the **Side Navigation Slider** to explore dedicated modules:
   - **Vessels**: Search and inspect individual carriers.
   - **Terminals**: Review deep-water berth matrix and STS crane status.
   - **Dispatch**: Review the step-by-step action plan and click **"Authorize Dispatch"**.
   - **Simulation**: Trigger a What-If crane breakdown or berth outage.
   - **Reports**: View the executive 72-hour shift briefing.
6. Open the **AI Copilot** (`⌘K` or click bottom-right widget) and ask: `"Which vessels are at critical risk?"`.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Port 8000 already in use` | Another uvicorn or backend process is active | Identify process with `netstat -ano \| findstr :8000` and terminate it, or change port with `--port 8001` |
| `Port 3000 already in use` | Another node server is running | React will offer to run on port `3001` automatically (type `Y`) |
| `Database tables missing` | Seed script not executed | Run `python -m app.services.seed_data` from `src/portai/backend` |
| `AI Copilot returns fallback response` | `ANTHROPIC_API_KEY` not set in `.env` | This is expected behavior. The copilot seamlessly falls back to deterministic database-grounded summaries |
