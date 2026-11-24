# Data Pulse — BI, Data Preparation & Time-Series Forecasting Studio

Data Pulse is a full-stack Business Intelligence and Predictive Analytics SaaS application. Users upload CSV/Excel datasets, clean and version them in Data Lab, model relational star schemas and semantic measures, design multi-page dashboards and reports (2D charts, 3D visuals, KPI cards, PDF export), and generate validated time-series forecasts with What-If scenarios in Forecast Studio.

For deeper guides, see:
- [Project Structure (`docs/PROJECT_STRUCTURE.md`)](docs/PROJECT_STRUCTURE.md)
- [System Architecture (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)
- [Database Schema & Migrations (`docs/DATABASE.md`)](docs/DATABASE.md)

---

## Core Capabilities

- **Data Hub & Data Lab**: Upload CSV/TSV/Excel files (auto-encoding detection + lazy `xlsx` parsing), inspect column profiling metrics, build reversible step-based cleaning pipelines, and track atomic `dataset_versions` snapshots.
- **Semantic Data Model**: Auto-infer fact/dimension tables, relationships, measures, and hierarchies synced transactionally with saved dashboards and queried by canvas widgets via `semanticQueryEngine`.
- **Dashboards & Reports**: Free-form canvas workbench supporting Chart.js 2D visuals, Plotly 3D surfaces/scatter plots, KPI cards, cross-filtering, multi-page report layouts, and client-side multi-page PDF export.
- **Forecast Studio & Python Engine**:
  - **General & Business Modes**: Flexible time-series configuration alongside categorized business presets (Sales, Finance, Inventory, Marketing, General).
  - **Statistical & ML Pipeline**: Powered by Python (`pandas`, `numpy`, `statsmodels`, `scikit-learn`) evaluating Naive, Seasonal Naive, Moving Average, ETS, Holt-Winters, ARIMA, SARIMA, and Ridge time-indexed regression via zero-leakage expanding-window cross-validation.
  - **Uncertainty & What-If Scenarios**: 80%/90%/95% prediction intervals, data-quality warnings, interactive scenario overlays, and one-click dashboard pinning.
- **Bilingual EN / AR RTL**: Complete English (LTR) and Arabic (RTL) localization across navigation, Data Lab, widgets, and Forecast Studio.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS v4, Chart.js, Plotly, Lucide icons, jsPDF + html2canvas |
| Backend API | Node.js 20+, Express 4, TypeScript (`tsx` in dev, `esbuild` bundle in prod), Zod, Helmet, express-rate-limit |
| Database | PostgreSQL 14+ / Neon Serverless PostgreSQL (`pg` pooler-safe migrations & queries) |
| Forecasting Engine | Python 3.11+, Pandas, NumPy, Statsmodels, Scikit-learn, SciPy, Pytest |

---

## Repository Layout

```
.
├── server.ts                  # Unified dev/prod server: Express (/api) + Vite middleware or frontend/dist
├── package.json               # Unified workspace scripts (dev, build, start, lint, test)
├── Dockerfile                 # Multi-stage production container (frontend + backend)
├── frontend/                  # React 19 + Vite SPA (pages, components, ui primitives, i18n, tests)
├── backend/                   # Express REST API, auth, repositories, SQL migrations
│   └── forecasting_engine/    # Python CLI package invoked by backend/src/services/forecastRunner.ts
└── docs/                      # Architecture, folder guide, database schema docs & screenshots
```

See [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for the complete directory breakdown and contributor conventions.

---

## Prerequisites

- **Node.js** `>= 20` and `npm`
- **Python** `3.11+` (with `venv` support for `backend/forecasting_engine`)
- **PostgreSQL** `14+` or a **Neon** database connection string

---

## Installation & Setup

### 1. Install Node Dependencies

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials (**never commit `.env`**):

```bash
cp backend/.env.example backend/.env
```

Required variables in `backend/.env`:
- `DATABASE_URL`: PostgreSQL / Neon connection string (`postgresql://...`). Pooled (`-pooler`) and direct connections are both supported.
- `JWT_SECRET`: HMAC signing key (`openssl rand -hex 48`, minimum 32 characters; mandatory in production).

Optional forecasting engine limits (defaults work out of the box):
- `FORECAST_PYTHON_BIN`: Custom path to the Python interpreter (auto-detects `backend/forecasting_engine/.venv/bin/python3`).
- `FORECAST_MAX_OBSERVATIONS`: Max aggregated time points (default `10000`).
- `FORECAST_MAX_CONCURRENT`: Max simultaneous Python worker processes (default `3`).
- `FORECAST_TIMEOUT_MS`: Subprocess timeout in milliseconds (default `45000`).

### 3. Set Up Python Virtual Environment (Forecast Studio)

```bash
python3 -m venv backend/forecasting_engine/.venv
backend/forecasting_engine/.venv/bin/pip install -r backend/forecasting_engine/requirements.txt
```

---

## Running & Verifying the Application

### Development

Run the unified root server (Express API + Vite frontend on `http://localhost:3000`, migrations run automatically on startup):

```bash
npm run dev
```

Or run backend and frontend separately during UI-only iteration:

```bash
# Terminal 1: Backend API on :3000
npm --prefix backend run dev

# Terminal 2: Vite dev server on :5173 (proxies /api -> localhost:3000)
npm --prefix frontend run dev
```

### Production Build & Start

```bash
npm run build   # Builds frontend/dist and bundles backend/dist/server.cjs
npm start       # Starts NODE_ENV=production node backend/dist/server.cjs
```

### Linting & Test Suites

```bash
# TypeScript static type-checks (backend + frontend)
npm run lint

# Frontend unit & UI tests (Vitest)
npm --prefix frontend test -- --run

# Python forecasting engine tests (Pytest)
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 \
  backend/forecasting_engine/.venv/bin/pytest -v backend/forecasting_engine/tests

# Backend API & Neon integration tests (requires reachable Postgres/Neon URL in TEST_DATABASE_URL / DATABASE_URL)
TEST_DATABASE_URL="$DATABASE_URL" NODE_ENV=test npm --prefix backend test -- --testTimeout=60000
```

---

## Security & Storage Principles

- **PostgreSQL Single Source of Truth**: All accounts, datasets, transformation versions, dashboards, semantic models, user preferences, and forecasts live in PostgreSQL. Dashboards store lightweight dataset references rather than duplicating rows.
- **Zero Client-Side Persistence**: `localStorage`, `sessionStorage`, `IndexedDB`, and client-writable cookies are strictly prohibited (verified by `frontend/src/test/noBrowserStorage.test.ts`).
- **Workspace Isolation**: Every database query filters strictly on `workspace_id`, with client string IDs deterministically mapped to workspace-scoped UUID v5 keys (`backend/src/lib/ids.ts`).
- **Session & CSRF Protection**: PBKDF2-SHA512 password hashing (210k iterations), `httpOnly` + `SameSite=Lax` JWT session cookies, `Cache-Control: no-store` on `/api`, `Sec-Fetch-Site` cross-site request guards, Helmet CSP, and strict auth rate limiting.

---

## Health Checks & Container Deployment

- `GET /api/health` — Liveness probe (`{"status":"ok"}`).
- `GET /api/ready` — Database readiness & latency check (`{"status":"ready","dbLatencyMs":...}`).
- `GET /api/neon/status` — Database connectivity badge endpoint used by the UI.

```bash
docker build -t data-pulse .
docker run -p 8080:8080 -e DATABASE_URL=... -e JWT_SECRET=... data-pulse
```
