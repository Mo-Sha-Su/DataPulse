# Database Schema, Isolation & Migrations

**Data Pulse** persists all application state in **PostgreSQL 14+** (developed and tested against **Neon Serverless PostgreSQL**, including `-pooler` transaction-mode endpoints).

All schema definitions live in [`backend/src/migrations/index.ts`](../backend/src/migrations/index.ts) and all SQL queries are encapsulated inside `backend/src/repositories/`.

---

## 1. Tables & Relationships

```
users (id)
  ├── 1:N ──► workspaces (id, owner_id)
  └── 1:1 ──► user_settings (user_id)

workspaces (id)
  ├── 1:N ──► datasets (id, workspace_id, client_id, current_version_id)
  │             └── 1:N ──► dataset_versions (id, dataset_id)
  ├── 1:N ──► dashboards (id, workspace_id, client_id)
  │             └── 1:1 ──► data_models (id, workspace_id, dashboard_id)
  └── 1:N ──► forecasts (id, workspace_id, user_id, client_id, dataset_id)
                ├── 1:N (ON DELETE CASCADE) ──► forecast_results (id, forecast_id)
                └── 1:N (ON DELETE CASCADE) ──► forecast_scenarios (id, forecast_id)
```

### Core Account & Workspace Tables
- **`users`**: Stores `id` (UUID PK), case-insensitive unique `email` (`users_email_lower_uidx`), `hashed_password` (PBKDF2-SHA512), `full_name`, `role`, `created_at`, `updated_at`.
- **`workspaces`**: Every registered user owns a personal workspace (`id`, `owner_id`, `name`). All analytical tables store `workspace_id` for strict multi-tenant filtering.
- **`user_settings`**: Stores `user_id` (PK), `preferences` (`jsonb`), and `theme` (`'light' | 'dark'`).

### Dataset & Versioning Tables
- **`datasets`**: Single source of truth for tabular data. Stores metadata (`name`, `file_name`, `source_type`, `description`, `tags`, `row_count`, `column_count`), `columns_config` (`jsonb`), raw `data` (`jsonb`), Data Lab `cleaned_data` (`jsonb`), `cleaning_pipeline` (`jsonb`), and `current_version_id` (`varchar`).
- **`dataset_versions`**: Immutable audit snapshots of dataset transformations (`id` e.g. `v_<dbId>_<num>_<ts>`, `dataset_id`, monotonic `version_number`, `transformation_steps`, `row_count`, `column_count`, `created_by`). Created automatically on upload and whenever Data Lab commits pipeline changes.

### Dashboard & Semantic Modeling Tables
- **`dashboards`**: Stores dashboard/report metadata (`name`, `description`, `thumbnail`, `used_for`), global `filters` (`json`), `canvas_state` (`json`), and full serialized workbench `payload` (`jsonb`). Before writing, `slimDashboard()` strips `data` and `cleanedData` arrays so datasets are never duplicated inside dashboard payloads.
- **`data_models`**: Stores semantic star schemas (`fact_tables`, `dimension_tables`, `relationships`, `measures`, `hierarchies`, `versions`, and full `state` JSONB). When a dashboard contains a model, `syncDashboardModel()` upserts/deletes the corresponding `data_models` row inside the **same database transaction** as the dashboard save.

### Forecast Studio Tables (Migration `004_forecasts`)
- **`forecasts`**: Saved forecast definitions and latest execution state (`mode`, `business_template`, `dataset_id`, `dataset_version_id`, `configuration` JSONB, `selected_model`, `status` `'draft' | 'running' | 'completed' | 'failed'`, `error_message`).
- **`forecast_results`**: Child execution snapshots referencing `forecasts(id) ON DELETE CASCADE`. Persists `historical_data`, `predicted_data`, `prediction_intervals`, `summary`, `evaluation_metrics`, `model_metadata`, `data_quality`, `warnings`, `notes`, and the `dataset_version_id` used during that run (allowing the UI to detect stale forecasts when a dataset is re-cleaned).
- **`forecast_scenarios`**: Child What-If scenario records referencing `forecasts(id) ON DELETE CASCADE`, storing input `assumptions` and adjusted `scenario_results` curves.

---

## 2. Deterministic Tenant-Scoped IDs (`resolveDbId`)

The frontend assigns human-friendly string identifiers such as `ds_173...`, `dash_...`, or `fc_...`. Because database primary keys are strict `uuid` columns:
1. `backend/src/lib/ids.ts` checks if the incoming ID is already a valid UUID.
2. Otherwise, it computes a deterministic **RFC 4122 UUID v5** using `workspaceId` as the namespace and the string ID as the name, storing the original string in `client_id`.
3. API responses always return `client_id || id`, keeping URLs and references identical across reloads while making cross-tenant ID collision mathematically impossible.

---

## 3. Connection Pooling & Pooler-Safe Migrations

- **Neon / PgBouncer Compatibility (`backend/src/db.ts`)**: Detects `-pooler.`, `pgbouncer=true`, `:6432`, or `pooler.supabase.` in `DATABASE_URL`. Uses client-side `query_timeout: 35000` everywhere and omits session-level `statement_timeout` startup parameters when connected through a transaction pooler.
- **Advisory-Locked Migrations (`backend/src/migrations/index.ts`)**:
  - `schema_migrations` tracks applied IDs (`001_baseline`, `002_indexes`, `003_legacy_schema_repair`, `004_forecasts`).
  - Each migration runs inside a single transaction guarded by `pg_advisory_xact_lock(727001)`, preventing concurrent container boots from racing while remaining transaction-pooler safe.
  - `003_legacy_schema_repair` idempotently repairs older schemas by adding missing columns/defaults and dropping blocking `NOT NULL` constraints on unknown legacy columns.
- **Legacy Data Rescue (`rescueEmbeddedDatasets`)**: Runs idempotently at startup to extract any datasets embedded inside pre-migration dashboard payloads into the `datasets` table and strip duplicate rows from the dashboard record.
