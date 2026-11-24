import { tx } from '../db';
import { logger } from '../lib/logger';

export interface Migration {
  id: string;
  sql: string;
}

/**
 * Append-only list. Never edit a migration that has shipped - add a new one.
 * Every statement is idempotent so the baseline is safe to run against a database
 * that was created by the earlier (pre-migration) version of the app.
 */
export const migrations: Migration[] = [
  {
    id: '001_baseline',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email varchar NOT NULL,
        hashed_password text,
        full_name varchar,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar;

      DO $$ BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email));
      EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Duplicate emails exist - users_email_lower_uidx not created. Resolve duplicates manually.';
      END $$;

      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY,
        owner_id uuid NOT NULL,
        name varchar,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces (owner_id);

      CREATE TABLE IF NOT EXISTS datasets (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL,
        name varchar NOT NULL,
        file_name varchar,
        storage_path varchar,
        analytics_path varchar,
        row_count int,
        column_count int,
        status varchar,
        error_message text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS data jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS cleaned_data jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS cleaning_pipeline jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS current_version_id varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS tags jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS columns_config jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_type varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS client_id varchar;

      CREATE TABLE IF NOT EXISTS dataset_versions (
        id varchar PRIMARY KEY,
        dataset_id varchar NOT NULL,
        version_number int NOT NULL,
        transformation_steps jsonb DEFAULT '[]'::jsonb,
        row_count int NOT NULL,
        column_count int NOT NULL,
        created_at timestamptz DEFAULT now(),
        created_by varchar
      );

      CREATE TABLE IF NOT EXISTS dashboards (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL,
        name varchar NOT NULL,
        description text,
        thumbnail varchar,
        used_for varchar,
        filters json,
        canvas_state json,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS payload jsonb;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS client_id varchar;

      CREATE TABLE IF NOT EXISTS data_models (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL,
        dashboard_id uuid,
        name varchar NOT NULL,
        fact_tables jsonb DEFAULT '[]'::jsonb,
        dimension_tables jsonb DEFAULT '[]'::jsonb,
        relationships jsonb DEFAULT '[]'::jsonb,
        measures jsonb DEFAULT '[]'::jsonb,
        hierarchies jsonb DEFAULT '[]'::jsonb,
        versions jsonb DEFAULT '[]'::jsonb,
        state jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS client_id varchar;

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id uuid PRIMARY KEY,
        preferences jsonb DEFAULT '{}'::jsonb,
        theme varchar DEFAULT 'light',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `,
  },
  {
    id: '002_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS datasets_ws_updated_idx ON datasets (workspace_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS dashboards_ws_updated_idx ON dashboards (workspace_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS data_models_ws_updated_idx ON data_models (workspace_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS data_models_dashboard_idx ON data_models (dashboard_id);
      CREATE INDEX IF NOT EXISTS dataset_versions_dataset_idx ON dataset_versions (dataset_id, version_number);
    `,
  },
  {
    // Databases created by earlier versions of the app can have leftover tables whose columns don't match
    // (e.g. created_at NOT NULL without a default, or extra required columns this code never fills in).
    // CREATE TABLE IF NOT EXISTS in the baseline can't repair those, so fix them here. Idempotent.
    id: '003_legacy_schema_repair',
    sql: `
      -- 0) make sure every column the app reads/writes exists (a leftover table may be missing some)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name varchar;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id uuid;
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS name varchar;
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS name varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_name varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS storage_path varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS analytics_path varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS row_count int;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS column_count int;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS status varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS error_message text;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS data jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS cleaned_data jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS cleaning_pipeline jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS current_version_id varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS tags jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS columns_config jsonb;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_type varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS client_id varchar;
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE datasets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS dataset_id varchar;
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS version_number int;
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS transformation_steps jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS row_count int;
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS column_count int;
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS created_by varchar;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS name varchar;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS thumbnail varchar;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS used_for varchar;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS filters json;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS canvas_state json;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS payload jsonb;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS client_id varchar;
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS dashboard_id uuid;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS name varchar;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS fact_tables jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS dimension_tables jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS relationships jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS measures jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS hierarchies jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS versions jsonb DEFAULT '[]'::jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS state jsonb;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS client_id varchar;
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE data_models ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme varchar DEFAULT 'light';
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

      DO $$
      DECLARE r record;
      BEGIN
        -- 1) every created_at / updated_at gets a default
        FOR r IN
          SELECT table_name, column_name FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name IN ('users','workspaces','datasets','dataset_versions','dashboards','data_models','user_settings')
            AND column_name IN ('created_at','updated_at')
            AND column_default IS NULL AND is_generated = 'NEVER' AND is_identity = 'NO'
        LOOP
          EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT now()', r.table_name, r.column_name);
        END LOOP;

        -- 2) required columns this app does not know about must not block inserts
        FOR r IN
          SELECT c.table_name, c.column_name FROM information_schema.columns c
          WHERE c.table_schema = current_schema()
            AND c.table_name IN ('users','workspaces','datasets','dataset_versions','dashboards','data_models','user_settings')
            AND c.is_nullable = 'NO' AND c.column_default IS NULL
            AND c.is_generated = 'NEVER' AND c.is_identity = 'NO'
            AND (c.table_name, c.column_name) NOT IN (VALUES
              ('users','id'),('users','email'),
              ('workspaces','id'),('workspaces','owner_id'),
              ('datasets','id'),('datasets','workspace_id'),('datasets','name'),
              ('dataset_versions','id'),('dataset_versions','dataset_id'),('dataset_versions','version_number'),
              ('dataset_versions','row_count'),('dataset_versions','column_count'),
              ('dashboards','id'),('dashboards','workspace_id'),('dashboards','name'),
              ('data_models','id'),('data_models','workspace_id'),('data_models','name'),
              ('user_settings','user_id'))
            AND NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage k USING (constraint_name, table_schema, table_name)
              WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = c.table_schema
                AND tc.table_name = c.table_name AND k.column_name = c.column_name)
        LOOP
          EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', r.table_name, r.column_name);
        END LOOP;
      END $$;
    `,
  },
  {
    id: '004_forecasts',
    sql: `
      CREATE TABLE IF NOT EXISTS forecasts (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL,
        user_id uuid NOT NULL,
        client_id varchar,
        name varchar NOT NULL,
        mode varchar NOT NULL DEFAULT 'general',
        business_template varchar,
        dataset_id varchar NOT NULL,
        dataset_version_id varchar,
        configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
        selected_model varchar,
        status varchar NOT NULL DEFAULT 'draft',
        error_message text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS forecast_results (
        id uuid PRIMARY KEY,
        forecast_id uuid NOT NULL REFERENCES forecasts(id) ON DELETE CASCADE,
        workspace_id uuid NOT NULL,
        dataset_version_id varchar,
        selected_model varchar NOT NULL,
        frequency varchar NOT NULL,
        horizon_days int NOT NULL,
        horizon_steps int NOT NULL,
        historical_data jsonb NOT NULL DEFAULT '[]'::jsonb,
        predicted_data jsonb NOT NULL DEFAULT '[]'::jsonb,
        prediction_intervals jsonb NOT NULL DEFAULT '{}'::jsonb,
        summary jsonb NOT NULL DEFAULT '{}'::jsonb,
        evaluation_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
        model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        data_quality jsonb NOT NULL DEFAULT '{}'::jsonb,
        warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
        notes jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS forecast_scenarios (
        id uuid PRIMARY KEY,
        forecast_id uuid NOT NULL REFERENCES forecasts(id) ON DELETE CASCADE,
        workspace_id uuid NOT NULL,
        user_id uuid NOT NULL,
        client_id varchar,
        name varchar NOT NULL,
        assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,
        scenario_results jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS forecasts_ws_updated_idx ON forecasts (workspace_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS forecast_results_fc_created_idx ON forecast_results (forecast_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS forecast_scenarios_fc_created_idx ON forecast_scenarios (forecast_id, created_at DESC);
    `,
  },
  {
    id: '005_forecast_execution_lock',
    sql: `
      ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS execution_token varchar;
      ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS execution_started_at timestamptz;
      ALTER TABLE forecast_scenarios ADD COLUMN IF NOT EXISTS baseline_result_id uuid;
      CREATE INDEX IF NOT EXISTS forecasts_running_idx ON forecasts (workspace_id, status) WHERE status = 'running';
    `,
  },
];

const LOCK_KEY = 727_001; // arbitrary app-wide advisory lock id

/**
 * Applies pending migrations. Each migration runs in ONE transaction that first takes a transaction-scoped
 * advisory lock (pg_advisory_xact_lock). Unlike a session-level lock, it is safe behind transaction poolers
 * (Neon pooler / PgBouncer), and it still serialises instances that boot at the same time.
 */
export async function runMigrations(): Promise<string[]> {
  const applied: string[] = [];
  for (const m of migrations) {
    await tx(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
      await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id varchar PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      const done = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [m.id]);
      if (done.rowCount) return; // another instance (or an earlier boot) already applied it
      logger.info('Applying migration', { id: m.id });
      await client.query(m.sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id]);
      applied.push(m.id);
    });
  }
  return applied;
}
