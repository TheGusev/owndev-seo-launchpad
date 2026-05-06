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

// Each entry: [migration_name, probe_table_or_null].
// If probe_table is set, we only mark the migration as applied when that
// table actually exists in the prod DB. If it's missing, we leave the
// migration UNMARKED so migrate.js will run it from scratch.
// For pure-seed migrations (no CREATE TABLE) probe is null — those use
// ON CONFLICT DO NOTHING, so re-running them is safe; we mark them only
// when their target table already has rows.
const LEGACY_MIGRATIONS = [
  ['001_initial.sql',                'users'],
  ['002_site_formula.sql',           'blueprint_sessions'],
  ['003_marketplace_audit.sql',      'marketplace_audits'],
  ['020_formula_v2.sql',             'formula_page_contracts'],
  ['020a_schema_templates_seed.sql', { seed: 'formula_schema_templates' }],
  ['020b_page_contracts_seed.sql',   { seed: 'formula_page_contracts' }],
  ['021_wordstat.sql',               'wordstat_cache'],
  ['022_crawl.sql',                  'crawl_sessions'],
  ['023_audit.sql',                  'site_audit_results'],
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
    let skipped = 0;
    let unmarked = 0;
    for (const [name, probe] of LEGACY_MIGRATIONS) {
      let shouldMark = true;
      let realTableExists = true;
      if (typeof probe === 'string') {
        // CREATE TABLE migration — only mark applied if the table really exists.
        const t = await sql`SELECT to_regclass(${'public.' + probe}) AS t`;
        if (!t[0].t) {
          shouldMark = false;
          realTableExists = false;
          console.log(`[premark] SKIP mark ${name} — table '${probe}' is MISSING; migrate.js will create it.`);
        }
      } else if (probe && probe.seed) {
        // Seed migration — only mark applied if target table exists AND has rows.
        const t = await sql`SELECT to_regclass(${'public.' + probe.seed}) AS t`;
        if (!t[0].t) {
          shouldMark = false;
          console.log(`[premark] SKIP mark ${name} — seed target '${probe.seed}' is MISSING; will be seeded by migrate.js.`);
        } else {
          const rc = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM ${probe.seed}`);
          if (!rc[0] || rc[0].n === 0) {
            shouldMark = false;
            console.log(`[premark] SKIP mark ${name} — seed target '${probe.seed}' is EMPTY; will be seeded by migrate.js.`);
          }
        }
      }
      if (!shouldMark) {
        skipped++;
        // Repair: if a previous buggy premark marked this migration as applied
        // but its table doesn't exist, clear the stale mark so migrate.js retries.
        if (!realTableExists) {
          const cleared = await sql`
            DELETE FROM _schema_migrations WHERE name=${name} RETURNING name
          `;
          if (cleared.length > 0) {
            unmarked++;
            console.log(`[premark] CLEARED stale mark for ${name} (real table missing) so migrate.js will create it.`);
          }
        }
        continue;
      }
      const r = await sql`
        INSERT INTO _schema_migrations (name)
        VALUES (${name})
        ON CONFLICT (name) DO NOTHING
        RETURNING name
      `;
      if (r.length > 0) inserted++;
    }
    console.log(`[premark] Existing prod DB detected. Pre-marked ${inserted} new legacy migrations; ${skipped} skipped (${unmarked} stale marks cleared); rest already recorded.`);

    // ── Repair: a previous deploy mistakenly marked 031 as applied via a buggy debug runner ──
    // even though the ALTER TABLE never actually ran. If engine_version column is missing
    // we know 031 didn't really apply, so unmark it so migrate.js will retry.
    const v3Probe = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='formula_page_contracts'
        AND column_name='engine_version'
    `;
    if (v3Probe.length === 0) {
      const cleared = await sql`
        DELETE FROM _schema_migrations WHERE name='031_v3_page_contracts_v2.sql' RETURNING name
      `;
      if (cleared.length > 0) {
        console.log('[premark] Cleared stale 031 mark (engine_version missing) so migrate.js can retry.');
      }
    }

    // ── Diagnostic: dump column defaults & types for formula_page_contracts ──
    // We had a deploy fail with `malformed array literal: "{},"` on the ALTER TABLE
    // step of migration 031. The file does not contain `{},` anywhere — it must come
    // from a DEFAULT or column we didn't know about. Print the schema so we can see.
    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'formula_page_contracts'
      ORDER BY ordinal_position
    `;
    console.log('[diag] formula_page_contracts columns:');
    for (const c of cols) {
      console.log(`  - ${c.column_name.padEnd(32)} ${String(c.data_type).padEnd(20)} null=${c.is_nullable.padEnd(3)} default=${c.column_default}`);
    }
    // Also peek a few existing rows to see if any TEXT[] field has a literal `{},` value
    const rowCount = await sql`SELECT COUNT(*)::int AS n FROM formula_page_contracts`;
    console.log(`[diag] formula_page_contracts row count: ${rowCount[0].n}`);
    if (rowCount[0].n > 0) {
      const sample = await sql`
        SELECT id, project_type_code, page_type, version,
               required_schemas, required_blocks, recommended_blocks, recommended_schemas
        FROM formula_page_contracts
        ORDER BY id DESC
        LIMIT 3
      `;
      console.log('[diag] sample rows:', JSON.stringify(sample, null, 2));
    }

    await sql.end();
  } catch (err) {
    console.error('[premark] Failed:', err && err.message ? err.message : err);
    try { await sql.end(); } catch {}
    process.exit(1);
  }
}

main();
