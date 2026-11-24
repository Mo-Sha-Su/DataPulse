# System Architecture Overview

**Data Pulse** follows a layered full-stack architecture pairing a React SPA frontend, an Express + PostgreSQL REST API backend, and an isolated Python statistical/ML forecasting engine.

---

## 1. Runtime Topologies

### Unified Server (`server.ts` — Development & Monolithic Production)
- Mounted on port **3000** (`npm run dev` via `tsx server.ts`).
- Runs `ping()` -> `runMigrations()` -> `rescueEmbeddedDatasets()` asynchronously at boot while holding non-health `/api/*` requests via `waitForReady` until DB initialization settles.
- Mounts the Express API (`backend/src/app.ts`) under `/api`.
- In development (`NODE_ENV !== 'production'`), attaches Vite middleware for `/frontend` with `/api` served directly on the same origin.
- In production (`NODE_ENV === 'production'`), serves static hashed assets from `frontend/dist` with immutable cache headers and SPA fallback routing.

### Container / Standalone Backend (`Dockerfile` -> `backend/src/main.ts`)
- Builds `frontend/dist` and bundles `backend/src/main.ts` into `backend/dist/server.cjs` via `esbuild`.
- Express hosts the built static frontend directly from `./public` on port `8080`.

```
  Browser (React 19 SPA)
         │  Same-origin HTTP + httpOnly JWT cookie (no localStorage)
         ▼
  Express Server (backend/src/app.ts)
    ├── /api/health, /api/ready, /api/neon/status
    ├── /api/auth/*        ──► users / workspaces repositories
    ├── /api/datasets/*    ──► datasets / dataset_versions repositories
    ├── /api/dashboards/*  ──► dashboards + syncDashboardModel()
    ├── /api/models/*      ──► data_models repository
    ├── /api/settings/*    ──► user_settings repository
    └── /api/forecasts/*   ──► forecasts repositories + Python subprocess bridge
                                       │
                                       ▼ (stdin/stdout JSON)
                          python3 -m forecasting_engine.cli
```

---

## 2. Frontend Architecture

### In-Memory State & API Synchronization
- On startup, `App.tsx` checks `GET /api/auth/me`.
- Authenticated state fetches user datasets (`GET /api/datasets`), dashboards (`GET /api/dashboards`), and user settings (`GET /api/settings`) directly from PostgreSQL into React memory.
- Every client service (`services/*.ts`) treats PostgreSQL as authoritative: loads and mutations fail visibly with structured errors rather than caching silently in browser storage.

### Localization (`frontend/src/i18n/`)
- `translations.ts` holds synchronized English (`en`) and Arabic (`ar`) maps.
- `LanguageContext.tsx` manages active language state, locale-aware number/date formatting, pluralization (`getPluralCategory`), and automatic `document.documentElement.dir = 'rtl' | 'ltr'`.

### Key Analytical Subsystems
- **Data Lab (`DataCleaningEditorPage.tsx`, `transformationEngine.ts`)**: Executes deterministic, immutable pipeline steps on dataset rows (`cleanedData`), logs applied steps into `cleaningPipeline`, and commits atomic snapshots via `POST /api/datasets/:id/versions`.
- **Semantic Data Model (`dataModelingEngine.ts`, `semanticQueryEngine.ts`)**: Builds fact/dimension schemas and DAX-like calculated measures. Dashboards embed their active `dataModel` and pass it to every widget renderer.
- **Forecast Studio (`ForecastStudioPage.tsx`, `components/Forecast/*`)**: Orchestrates General & Business workflows, pre-flight frequency checks, cancellation via `AbortController`, multi-model evaluation tables, confidence band visualization (`ForecastChart.tsx`), What-If scenario overlays (`ForecastScenariosPanel.tsx`), and pinning completed forecasts onto dashboard canvases.

---

## 3. Backend Layering & Request Lifecycle

1. **Middleware Stack (`backend/src/app.ts`)**:
   - Request tracing (`requestContext`), Helmet security/CSP headers, compression, CORS (when `ALLOWED_ORIGINS` is configured), `Cache-Control: no-store` (`noStore`), and CSRF cross-site mutation blocking (`crossSiteGuard`).
   - Auth & rate limiters protect `/api`, `/api/auth/login`, and `/api/auth/register`.
2. **Validation (`backend/src/schemas.ts`, `middleware/errors.ts`)**:
   - Every POST/PUT body passes strict Zod validation via `validate(schema)` before reaching route logic.
3. **Routes (`backend/src/routes/*`)**:
   - Protected routes apply `requireAuth`, attaching `req.user` and `req.workspaceId`.
   - Routes stay thin: input checks, concurrency locks (for forecasts), and service/repository calls.
4. **Repositories (`backend/src/repositories/*`)**:
   - **All SQL lives inside repositories.**
   - Every query scopes strictly by `workspace_id` so tenants can never read or overwrite another workspace's resources (missing or cross-tenant IDs return `404`).
   - Client string IDs (e.g., `ds_...`, `dash_...`, `fc_...`) map deterministically per workspace to UUID v5 keys via `resolveDbId(workspaceId, clientId)`.

---

## 4. Node-to-Python Forecasting Bridge

Because statistical time-series libraries (`statsmodels`, `scikit-learn`, `pandas`, `numpy`) run natively in Python while the web API runs in Node.js:

1. Express (`backend/src/routes/forecasts.ts`) resolves active rows (`cleanedData` if present, otherwise `data`) and asserts source row limits (`maxObservations * 5`) plus an in-memory run lock (`workspaceId:forecastId`).
2. `backend/src/services/forecastRunner.ts` enforces concurrency (`FORECAST_MAX_CONCURRENT`) and timeout (`FORECAST_TIMEOUT_MS`) caps, attaches client `AbortSignal` handlers (closing the HTTP request kills the worker cleanly), and spawns:
   ```bash
   python3 -m forecasting_engine.cli
   ```
   inside `backend/` with single-threaded BLAS env vars (`OPENBLAS_NUM_THREADS=1`, `OMP_NUM_THREADS=1`, `MKL_NUM_THREADS=1`) for predictable latency.
3. Payload travels via `stdin`; stdout returns `{ ok: true, data }` or `{ ok: false, error: { code, message, details } }`.
4. `cli.py` routes between:
   - `detect_frequency`: Parses & aggregates series (`prepare.py`) and scores candidate intervals (`frequency.py`).
   - `run_forecast`: Prepares series, aligns evenly spaced calendar grids without fabricating missing observed points (`frequency.py`), benchmarks 8 statistical/ML models with zero-leakage chronological expanding-window CV (`models.py`), applies rolling fit caps (`<= 2000` observations for Holt-Winters/ARIMA, `<= 730` for SARIMA), and computes 80%/90%/95% intervals.
   - `run_scenario`: Applies What-If percentage adjustments (`scenarios.py`) over persisted baseline predictions without mutating the baseline run.
5. Express atomically saves the completed forecast metadata, prediction curves, evaluation metrics, and data-quality diagnostics in PostgreSQL (`saveForecastRunSuccess`).
