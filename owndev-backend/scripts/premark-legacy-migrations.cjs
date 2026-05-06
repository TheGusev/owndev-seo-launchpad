#!/usr/bin/env node
/**
 * Pre-marks legacy migrations 001-023 as already applied in `_schema_migrations`,
 * but ONLY if the production database was bootstrapped manually (i.e. the core
 * `formula_page_contracts` table already exists before this run).
 *
 * Why: production DB had migrations 001..029 applied by hand long before the
 * idempotent `migrate.ts` runner was wired into CI. When CI now runs
 * `node dist/db/migrate.js`, it would try to re-apply legacy migrations and
 * fail (e.g. 020b's INSERT seed conflicts with already-existing rows / NOT
 * NULL columns added by later manual SQL).
 *
 * On a fresh DB (no `formula_page_contracts` yet) we do nothing — migrate.js
 * should run all migrations from scratch.
 *
 * Idempotent: re-running this is a no-op.
 */
const path = require('path');

// Load `postgres` from the backend node_modules (this script runs on the prod server)
const postgresPath = path.resolve(__dirname, '..', 'node_modules', 'postgres');
const postgres = require(postgresPath);

const LEGACY_MIGRATIONS = [
  '001_initial.sql',
  '002_site_formula.sql',
  '003_marketplace_audit.sql',
  '020_formula_v2.sql',
  '020a_schema_templates_seed.sql',
  '020b_page_contracts_seed.sql',
  '021_wordstat.sql',
  '022_crawl.sql',
  '023_audit.sql',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set — aborting.');
    process.exit(1);
  }

  const sql = postgres(url, { ssl: false, max: 1 });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        name        VARCHAR(255) PRIMARY KEY,
        applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        checksum    VARCHAR(64)
      )
    `;

    // Detect whether this is an existing production DB (has core tables already)
    const probe = await sql`SELECT to_regclass('public.formula_page_contracts') AS t`;
    const exists = probe[0] && probe[0].t;

    if (!exists) {
      console.log('[premark] Fresh DB detected (formula_page_contracts missing) — skipping pre-mark; migrate.js will run all migrations from scratch.');
      await sql.end();
      return;
    }

    let inserted = 0;
    for (const name of LEGACY_MIGRATIONS) {
      const r = await sql`
        INSERT INTO _schema_migrations (name)
        VALUES (${name})
        ON CONFLICT (name) DO NOTHING
        RETURNING name
      `;
      if (r.length > 0) inserted++;
    }
    console.log(`[premark] Existing prod DB detected. Pre-marked ${inserted} of ${LEGACY_MIGRATIONS.length} legacy migrations as applied (others were already recorded).`);
    await sql.end();
  } catch (err) {
    console.error('[premark] Failed:', err && err.message ? err.message : err);
    try { await sql.end(); } catch {}
    process.exit(1);
  }
}

main();
