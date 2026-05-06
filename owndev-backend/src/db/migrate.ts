/**
 * Idempotent migration runner.
 *
 * Reads every *.sql file from src/db/migrations in lexicographic order and
 * applies them through the existing `postgres` client. Each migration is
 * recorded in `_schema_migrations` so re-runs are no-ops.
 *
 * Usage:
 *   npm run migrate                        # build first, then runs dist/db/migrate.js
 *   npx tsx src/db/migrate.ts              # dev, no build needed
 *   node dist/db/migrate.js                # prod
 *
 * Each .sql file may contain multiple statements separated by ';'. We
 * intentionally do NOT split on ';' (string literals can contain it). Instead
 * each file is executed as a single multi-statement query via `sql.unsafe()`.
 * That is safe here because the source is local files we trust, not user input.
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sql, testConnection } from './client.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve relative to compiled location: dist/db/migrate.js → dist/db/migrations
// In dev (tsx) this resolves to src/db/migrations directly.
const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

interface MigrationFile {
  name: string;
  path: string;
  sql: string;
}

function loadMigrationFiles(): MigrationFile[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic — '001_*.sql' before '002_*.sql' before '020_*.sql'

  return files.map((name) => ({
    name,
    path: resolve(MIGRATIONS_DIR, name),
    sql: readFileSync(resolve(MIGRATIONS_DIR, name), 'utf-8'),
  }));
}

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name        VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      checksum    VARCHAR(64)
    )
  `;
}

async function getApplied(): Promise<Set<string>> {
  const rows = await sql<{ name: string }[]>`SELECT name FROM _schema_migrations`;
  return new Set(rows.map((r) => r.name));
}

async function applyMigration(file: MigrationFile): Promise<void> {
  // Run the file as a single block. `postgres` driver's `unsafe()` allows
  // multiple statements separated by ';' when no parameters are passed.
  try {
    await sql.unsafe(file.sql);
  } catch (err: any) {
    // Surface every diagnostic the postgres driver gives us so we can find
    // the exact statement that broke. Without this, deploy logs show only
    // the bare error message and we can't locate the offending SQL.
    const detail = {
      file: file.name,
      message: err?.message,
      code: err?.code,
      severity: err?.severity,
      position: err?.position,
      where: err?.where,
      hint: err?.hint,
      detail: err?.detail,
      internal_query: err?.internal_query,
      query_excerpt: err?.query ? String(err.query).slice(0, 1200) : undefined,
    };
    logger.error('MIGRATE', `FAILED ${file.name}: ${JSON.stringify(detail, null, 2)}`);
    throw err;
  }
  await sql`
    INSERT INTO _schema_migrations (name) VALUES (${file.name})
    ON CONFLICT (name) DO NOTHING
  `;
}

export async function runMigrations(): Promise<void> {
  const ok = await testConnection();
  if (!ok) {
    throw new Error('Database not reachable — set DATABASE_URL and try again.');
  }

  await ensureMigrationsTable();
  const applied = await getApplied();
  const files = loadMigrationFiles();

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file.name)) {
      logger.info('MIGRATE', `skip ${file.name} (already applied)`);
      continue;
    }
    logger.info('MIGRATE', `apply ${file.name}…`);
    await applyMigration(file);
    appliedCount++;
    logger.info('MIGRATE', `done ${file.name}`);
  }

  logger.info('MIGRATE', `Finished. ${appliedCount} new migration(s) applied, ${files.length - appliedCount} already in place.`);
}

// Allow direct execution: `node dist/db/migrate.js` or `tsx src/db/migrate.ts`.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  runMigrations()
    .then(async () => {
      await sql.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('MIGRATE', err?.message || String(err));
      await sql.end();
      process.exit(1);
    });
}
