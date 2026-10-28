# UK Wind Power Generation: Day-Ahead Forecast Monitor

A production-grade analytics platform that monitors, evaluates, and visualizes the accuracy of day-ahead wind power forecasts against actual generation across Great Britain for **January 2026**.

Built with **FastAPI** (Python 3.12) and **React** (TypeScript + Vite + Tailwind CSS + Recharts), adhering to official Elexon BMRS market data standards.

---

## AI Tools Used in Development

This application was architected, designed, built, and tested with the support of modern AI tools:

- **ChatGPT**: Used for initial brainstorming, requirement scoping, and market rule exploration.
- **Google Stitch**: Used for UI/UX design generation, visual layout prototyping, and design token extraction (`Wind Forecast Dashboard - Simplified`).
- **Antigravity IDE (Claude & Gemini)**: Used for agentic pair programming

---

## Key Features

- **Automated Data Ingestion & Alignment:** Fetches actual generation (`FUELHH`) and day-ahead forecast runs (`WINDFOR`) from the Elexon Insights Solution API.
- **Methodologically Sound Cutoff Rule:** Selects the latest forecast published strictly before **12:00 PM UTC** on the day prior to delivery (`delivery_date - 1 day`), ensuring a realistic trading/dispatch evaluation window.
- **Granularity Reconciliation:** Aggregates half-hourly settlement periods into hourly averages to match forecast hourly granularity.
- **Accredited Accuracy Metrics:** Calculates Mean Absolute Error (**MAE**), Root Mean Squared Error (**RMSE**), and Mean Bias Error (**MBE**) on matched observation pairs.
- **Data Quality & Telemetry Auditing:** Audits temporal coverage, flags sensor outages / gaps, and tracks interval status (`matched`, `missing_forecast`, `missing_actual`).
- **Interactive UI Dashboard:** High-performance dashboard styled according to Stitch design guidelines with interactive timeseries charts, metric cards, searchable tables, and CSV exports.

---

## Architectural Decisions & Methodology

| Decision Area | Chosen Approach | Rationale |
|---|---|---|
| **Temporal Granularity** | Option A: Average actuals to hourly | Hourly averaging preserves energy conservation and provides smooth alignment with WINDFOR hourly timestamps. |
| **Day-Ahead Cutoff** | 12:00 PM UTC on D-1 | Simulates standard market gate closure for day-ahead power commitments. All forecasts published after 12:00 UTC are discarded. |
| **API Versioning** | `/api/v1/` REST structure | Isolates API contracts and facilitates backwards compatibility. |
| **Error Formulation** | $\text{Error} = \text{Forecast} - \text{Actual}$ | Positive error indicates **overforecasting** (surplus predicted); negative indicates **underforecasting** (deficit). |

---

## API Endpoints

### 1. Health Check
```http
GET /api/v1/health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T12:00:00Z",
  "version": "1.0.0"
}
```

### 2. Analysis & Metrics
```http
GET /api/v1/analysis?start_date=2026-01-01&end_date=2026-01-31
```
Returns:
- `metadata`: Evaluation date boundaries and execution timestamp.
- `metrics`: `mae_mw`, `rmse_mw`, `mbe_mw`, `n_observations`, `avg_actual_mw`.
- `timeseries`: Hourly observation records with signed error and status.
- `data_quality`: Interval counts and coverage metrics.

### 3. Data Quality & Coverage
```http
GET /api/v1/data-quality?start_date=2026-01-01&end_date=2026-01-31
```

---

## Running the Application

### Option A: Docker Compose (Recommended)

Run both the backend and frontend with a single command:

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs

---

### Option B: Local Development Setup

#### 1. Backend

```bash
cd backend
# Create virtualenv and install dependencies
uv sync # or pip install -r requirements.txt

# Run Uvicorn development server
uv run uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Open **http://localhost:5173** in your browser.

---

## Running Automated Tests

The backend includes a comprehensive unit and integration test suite:

```bash
cd backend
uv run pytest -v
```

Tests cover:
- Mathematical correctness of MAE, RMSE, and MBE formulas with edge cases.
- Timezone handling and UTC alignment.
- Cutoff window enforcement (excluding forecasts published at or after 12:00 UTC).
- Outer-join status assignments and end-to-end pipeline execution.

---

## Project Structure

```
dfghju7ybh/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/          # health.py, analysis.py, data_quality.py
│   │   │   └── router.py           # v1 aggregator
│   │   ├── core/                   # config.py, exceptions.py
│   │   ├── schemas/                # Pydantic response models
│   │   ├── services/               # elexon_client.py, pipeline.py, metrics.py
│   │   └── main.py                 # FastAPI application factory
│   ├── tests/                      # test_metrics.py, test_pipeline.py
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/                    # client.ts
│   │   ├── components/             # Header, KPICards, TimeseriesChart, ComparisonTable, DataStatusPanel
│   │   ├── hooks/                  # useAnalysis.ts
│   │   ├── types/                  # api.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

# Live Vercel app url
https://frontend-eight-bice-72.vercel.app/
