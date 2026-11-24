# Project Structure & Contributor Guide

This document maps every folder in **Data Pulse** and establishes where new code belongs so features remain modular and easy to locate.

---

## Top-Level Layout

```
.
├── server.ts                  # Unified Express + Vite (dev) / static frontend (prod) entrypoint on port 3000
├── package.json               # Root workspace scripts (dev, build, start, lint, test)
├── Dockerfile                 # Multi-stage container build (frontend/dist + backend/dist)
├── README.md                  # Quickstart, setup, scripts, and security overview
├── docs/                      # Architecture, structure, database docs, and visual references
├── frontend/                  # React 19 + Vite + Tailwind v4 client SPA
└── backend/                   # Express REST API, PostgreSQL repositories, and Python forecasting engine
```

---

## Frontend (`frontend/src/`)

```
frontend/src/
├── App.tsx                    # Top-level application state, route synchronization, and authenticated bootstrap
├── main.tsx                   # React DOM root mount and self-hosted font/CSS imports
├── index.css                  # Tailwind v4 `@theme` design tokens, typography, and RTL utilities
├── pages/                     # Route-level views (one file per route in utils/router.ts)
│   ├── HomePage.tsx           # Public marketing landing page
│   ├── FeaturesPage.tsx       # Public capabilities showcase
│   ├── PricingPage.tsx        # Public plan comparison page
│   ├── AboutPage.tsx          # Public company/product story
│   ├── LoginPage.tsx          # Email/password authentication view
│   ├── SignupPage.tsx         # Account creation view
│   ├── DashboardHubPage.tsx   # Workspace library of dashboards and multi-page reports
│   ├── DataHubPage.tsx        # Dataset inventory, CSV/Excel upload, profiling, and version access
│   ├── DataCleaningEditorPage.tsx # Data Lab step-based transformation studio
│   ├── ForecastStudioPage.tsx # Predictive analytics orchestrator (mode, config, results, pin modal)
│   └── SampleGraphsPage.tsx   # Visual chart capability showcase
├── components/                # Feature-grouped & reusable UI modules
│   ├── Canvas/                # Interactive dashboard/report canvas grid, resize/drag handles, grid overlay
│   ├── DataCleaning/          # Data Lab step summary cards
│   ├── DataLab/               # Command bar, pipeline rail, column inspector, smart fixes, Ctrl+K palette
│   ├── DataModel/             # Semantic model viewer (fact/dimension tables, joins, measures)
│   ├── Filters/               # Global dashboard filter bar & cascading selectors
│   ├── Forecast/              # Forecast Studio subcomponents:
│   │   ├── ForecastConfigPanel.tsx        # Mode switcher, presets, field selectors, frequency/horizon controls
│   │   ├── ForecastResultsPanel.tsx       # KPI cards, uncertainty notes, model comparison table
│   │   ├── ForecastChart.tsx              # Historical actuals + future prediction + shaded confidence bands
│   │   ├── ForecastScenariosPanel.tsx     # What-If driver inputs and saved scenario selector
│   │   └── AddForecastToDashboardModal.tsx# Pin forecast widget into an existing or new dashboard
│   ├── Import/                # CSV/Excel upload modal & delimiter/encoding detection
│   ├── Modals/                # Canvas dialogs (PDF export options, Add Widget wizard, Delete confirm)
│   ├── Navbar/                # Shared `AppNavbar` header and language toggle
│   ├── Sidebar/               # Canvas left/right configuration drawers
│   ├── Toolbar/               # Top workbench action bar (save, undo/redo, page switcher, export)
│   ├── Widget/                # Widget wrapper & Chart.js / Plotly / KPI / Forecast renderers
│   ├── AnimatedBackground.tsx # Decorative canvas backdrop for public pages
│   ├── BrandLogo.tsx          # Data Pulse vector logo & wordmark
│   ├── ErrorBoundary.tsx      # React render error recovery boundary
│   └── NeonStatusBadge.tsx    # Live backend/database connection badge
├── ui/                        # Design system primitives (Button, Card, StatCard, Badge, EmptyState, PageHeader, Segmented, cx)
├── i18n/
│   ├── translations.ts        # Complete EN & AR key/value translation dictionary
│   └── LanguageContext.tsx    # Context provider, pluralization, LTR/RTL dir management, LanguageToggle
├── services/                  # Typed fetch wrappers talking to `/api/*`
│   ├── apiClient.ts           # Shared `buildApiError()` response parser
│   ├── authService.ts         # Session auth (`/api/auth/*`) and Bearer header helper
│   ├── dbService.ts           # Dashboards & user settings API client
│   ├── globalDatasetService.ts# Datasets & version snapshots API client
│   ├── forecastService.ts     # Forecast CRUD, run/cancel, frequency detection, scenarios API client
│   ├── neonService.ts         # Database health/status check (`/api/neon/status`)
│   └── geminiService.ts       # Deterministic heuristic widget auto-builder (zero external LLM calls)
├── data/                      # Static client registries, defaults, and business presets
│   ├── dashboardDefaults.ts   # `DEFAULT_CANVAS`, `DEFAULT_REPORT_CANVAS`, empty factory helpers
│   ├── sampleDashboards.ts    # Empty dashboard preset placeholder + re-exports from `dashboardDefaults`
│   ├── sampleDatasets.ts      # Empty collection (user-data-only policy)
│   ├── canonicalGlobalDatasets.ts # Empty canonical dataset registry
│   ├── forecastTemplates.ts   # Business presets, column matchers, valid horizons per frequency
│   └── widgetDefinitions.ts   # Supported chart, KPI, table, 3D, and forecast widget metadata
├── utils/                     # Pure frontend domain engines & helpers (zero UI)
│   ├── transformationEngine.ts# Reversible Data Lab step execution & smart fix suggestion logic
│   ├── dataModelingEngine.ts  # Relationship detection and star-schema inference
│   ├── semanticQueryEngine.ts # Cross-table join, measure evaluation, and widget aggregation
│   ├── datasetParser.ts       # CSV/Excel parsing & column type inference
│   ├── encodingDetector.ts    # UTF-8 / Windows-1256 / Arabic text encoding detection
│   ├── exportToPdf.ts         # On-demand html2canvas + jsPDF multi-page exporter
│   ├── reportPageDimensions.ts# A4/Letter/16:9 canvas dimension math
│   ├── dataProcessor.ts       # Widget-level sorting, bucketing, and formatting
│   ├── dataLabCommit.ts       # Persisting cleaned rows + version creation helpers
│   ├── columnProfile.ts       # Distinct counts, nulls, and distribution stats
│   ├── gridSelection.ts       # Canvas multi-widget selection math
│   ├── router.ts              # Pure URL <-> `AppRoute` mapping and auth boundary rules
│   └── xlsxLazy.ts            # Dynamic `import('xlsx')` wrapper for code-splitting
├── hooks/
│   └── useHistory.ts          # Generic undo/redo state stack used in the Workbench
├── types/                     # TypeScript interfaces (`auth`, `dashboard`, `dataCleaning`, `dataModel`, `forecast`)
└── test/                      # UI, i18n parity, no-browser-storage, and Forecast Studio Vitest suites
```

---

## Backend (`backend/`)

```
backend/
├── .env.example               # Documented environment template (safe placeholders only)
├── package.json               # Backend scripts (dev, build, start, test, lint)
├── src/
│   ├── main.ts                # Standalone backend entrypoint (used in Docker & separate API deploys)
│   ├── index.ts               # Server lifecycle, DB boot checks, migrations, graceful shutdown
│   ├── app.ts                 # Express factory: Helmet, CORS, security middleware, rate limits, `/api` router
│   ├── config.ts              # Zod-validated environment configuration loader
│   ├── db.ts                  # Neon pooler-aware `pg.Pool`, `query()`, `tx()`, and `ping()`
│   ├── schemas.ts             # Zod request payload schemas for all API routes
│   ├── types.ts               # Express `AuthenticatedRequest` and shared backend types
│   ├── migrations/
│   │   └── index.ts           # Append-only idempotent SQL migrations (`001_baseline` .. `004_forecasts`)
│   ├── middleware/
│   │   ├── auth.ts            # JWT cookie/Bearer verification and `workspaceId` resolution
│   │   ├── errors.ts          # `requestContext`, Zod `validate()`, `asyncHandler()`, JSON error formatter
│   │   └── security.ts        # `noStore` cache headers & `crossSiteGuard` CSRF protection
│   ├── routes/                # Thin HTTP controllers (validation + service/repo delegation only)
│   │   ├── index.ts           # `/api/health`, `/api/ready`, `/api/neon/status` + router mounting
│   │   ├── auth.ts            # `/api/auth/*` (register, login, logout, me)
│   │   ├── datasets.ts        # `/api/datasets/*` (CRUD, versions, column preview)
│   │   ├── dashboards.ts      # `/api/dashboards/*` (CRUD; strips embedded rows on save)
│   │   ├── models.ts          # `/api/models/*` (semantic data model CRUD)
│   │   ├── settings.ts        # `/api/settings/*` (workspace/user preferences)
│   │   └── forecasts.ts       # `/api/forecasts/*` (CRUD, frequency detect, run/cancel, scenarios)
│   ├── repositories/          # All SQL queries live strictly here (workspace-scoped, UUID v5 mapped)
│   │   ├── users.ts           # Account lookup & workspace creation
│   │   ├── workspaces.ts      # Workspace ownership helpers
│   │   ├── datasets.ts        # Dataset persistence & version snapshot queries
│   │   ├── dashboards.ts      # Dashboard persistence & `slimDashboard()` row stripping
│   │   ├── models.ts          # Semantic model persistence & `syncDashboardModel()`
│   │   ├── forecasts.ts       # Forecast, result payload, and scenario queries
│   │   ├── settings.ts        # User preference JSONB storage
│   │   └── rescue.ts          # Startup migration helper extracting legacy embedded dashboard rows
│   ├── services/
│   │   └── forecastRunner.ts  # Spawns Python `forecasting_engine.cli` with concurrency & abort handling
│   ├── lib/                   # Small pure backend utilities
│   │   ├── dates.ts           # Shared `toIsoTimestamp()` normalizer
│   │   ├── errors.ts          # Typed `HttpError` constructors (`badRequest`, `notFound`, `unauthorized`)
│   │   ├── ids.ts             # `resolveDbId()` deterministic workspace-scoped UUID v5 mapper
│   │   ├── json.ts            # Safe JSON serialization helpers for Postgres JSONB
│   │   ├── logger.ts          # Structured JSON logger & `errorMeta()` sanitizer
│   │   ├── password.ts        # PBKDF2-SHA512 hashing + constant-time verification
│   │   ├── rows.ts            # Column-ordered row serialization (`orderRowKeys`)
│   │   ├── session.ts         # `httpOnly`, `SameSite=Lax` cookie setters/clearers
│   │   └── tokens.ts          # HMAC-SHA256 JWT signing & verification
│   └── __tests__/             # Vitest + Supertest integration tests against live PostgreSQL
└── forecasting_engine/        # Isolated Python 3.11+ time-series forecasting package
    ├── requirements.txt       # numpy, pandas, scipy, statsmodels, scikit-learn, pytest
    ├── __init__.py
    ├── cli.py                 # Stdin/stdout JSON command router
    ├── prepare.py             # Date/numeric parsing, sorting, duplicate aggregation, IQR outlier flagging
    ├── frequency.py           # Cadence auto-detection, horizon mapping, calendar grid alignment
    ├── models.py              # Expanding-window CV, Naive/Seasonal/MA/ETS/HW/ARIMA/SARIMA/Ridge fit & bands
    ├── scenarios.py           # Deterministic What-If scenario curve projection
    └── tests/                 # Pytest unit & statistical correctness test suite
```

---

## Where to Add New Code

- **New Page**: Add a route variant in `frontend/src/utils/router.ts`, create `frontend/src/pages/<Feature>Page.tsx`, and wire lazy/route rendering in `frontend/src/App.tsx`.
- **Reusable Design Primitive**: Place inside `frontend/src/ui/`.
- **Feature-Specific Components**: Group under `frontend/src/components/<Feature>/`.
- **Translation Keys**: Add matching entries to both `en` and `ar` inside `frontend/src/i18n/translations.ts` (enforced by `frontend/src/test/i18n.test.ts`).
- **Backend Endpoint**: Add a Zod schema in `backend/src/schemas.ts`, SQL methods scoped by `workspace_id` in `backend/src/repositories/`, and thin HTTP handlers in `backend/src/routes/`.
- **Schema Change**: Append a new idempotent `Migration` object to `backend/src/migrations/index.ts`; never edit already-shipped migrations.
