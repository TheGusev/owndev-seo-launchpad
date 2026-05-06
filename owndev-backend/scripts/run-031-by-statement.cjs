#!/usr/bin/env node
/**
 * Splits migration 031 into individual statements and runs them one by one,
 * printing exactly which statement fails. Used to localise the
 * `malformed array literal: "{},"` error that we cannot find by reading the file.
 *
 * Splits naively on `;` followed by newline + non-quote (good enough for our SQL).
 */
const path = require('path');
const fs = require('fs');

const postgres = require(path.resolve(__dirname, '..', 'node_modules', 'postgres'));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

  const file = path.resolve(__dirname, '..', 'src', 'db', 'migrations', '031_v3_page_contracts_v2.sql');
  // Prefer the dist copy if present (closer to what migrate.js sees)
  const distFile = path.resolve(__dirname, '..', 'dist', 'db', 'migrations', '031_v3_page_contracts_v2.sql');
  const sqlText = fs.existsSync(distFile) ? fs.readFileSync(distFile, 'utf8') : fs.readFileSync(file, 'utf8');

  // Split on ';' that ends a statement: ';' followed by newline.
  // This is naive but our migrations don't have ';\n' inside string literals.
  const parts = sqlText.split(/;\s*\n/);
  const statements = parts
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s.split('\n')[0].trim()));

  console.log(`[run-031] split into ${statements.length} statements`);

  const sql = postgres(url, { ssl: false, max: 1 });
  let i = 0;
  for (const stmt of statements) {
    i++;
    const head = stmt.slice(0, 140).replace(/\n/g, ' ');
    console.log(`[run-031] [#${i}/${statements.length}] ${head}…`);
    try {
      await sql.unsafe(stmt);
    } catch (err) {
      console.error(`[run-031] FAILED at statement #${i}:`);
      console.error('  message :', err.message);
      console.error('  code    :', err.code);
      console.error('  position:', err.position);
      console.error('  detail  :', err.detail);
      console.error('  hint    :', err.hint);
      console.error('  --- offending statement (first 2500 chars) ---');
      console.error(stmt.slice(0, 2500));
      console.error('  --- end ---');
      await sql.end();
      process.exit(1);
    }
  }
  console.log(`[run-031] ALL ${statements.length} statements applied successfully.`);
  // Mark migration as applied so migrate.js skips it
  await sql`
    INSERT INTO _schema_migrations (name) VALUES ('031_v3_page_contracts_v2.sql')
    ON CONFLICT (name) DO NOTHING
  `;
  console.log('[run-031] marked 031 as applied in _schema_migrations.');
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
