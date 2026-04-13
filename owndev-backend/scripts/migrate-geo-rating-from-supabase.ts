import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  // 1. Check env
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!SUPABASE_URL) { console.error('❌ SUPABASE_URL not set'); process.exit(1); }
  if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY not set'); process.exit(1); }
  if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

  const sql = postgres(DATABASE_URL, { max: 5, idle_timeout: 10, connect_timeout: 10 });

  try {
    // 2. Fetch from Supabase
    const url = `${SUPABASE_URL}/rest/v1/geo_rating?select=*&order=llm_score.desc&limit=1000`;
    const resp = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      console.error(`❌ Supabase fetch failed: ${resp.status} ${resp.statusText}`);
      const body = await resp.text();
      console.error(body.slice(0, 500));
      process.exit(1);
    }

    const rows: any[] = await resp.json();
    console.log(`✅ Fetched ${rows.length} rows from Supabase`);

    if (rows.length === 0) {
      console.log('⚠️ No rows fetched — nothing to migrate');
      process.exit(0);
    }

    // 3. Check for duplicates in local DB
    const dupes = await sql`
      SELECT domain, count(*)::int as cnt
      FROM geo_rating
      GROUP BY domain
      HAVING count(*) > 1
    `;

    if (dupes.length > 0) {
      console.error(`❌ Found ${dupes.length} duplicate domain(s) in local geo_rating:`);
      for (const d of dupes) {
        console.error(`   ${d.domain} — ${d.cnt} rows`);
      }
      console.error('Fix duplicates manually before running migration.');
      process.exit(1);
    }

    console.log('✅ No duplicates in local geo_rating — safe to proceed');

    // 4. Create unique index
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`;
    console.log('✅ Unique index on domain ensured');

    // 5. Upsert rows
    let upserted = 0;
    for (const row of rows) {
      await sql`
        INSERT INTO geo_rating (
          domain, display_name, category,
          llm_score, seo_score, schema_score, direct_score,
          has_llms_txt, has_faqpage, has_schema,
          errors_count, top_errors,
          last_checked_at, created_at
        ) VALUES (
          ${row.domain},
          ${row.display_name},
          ${row.category ?? 'Сервисы'},
          ${row.llm_score ?? 0},
          ${row.seo_score ?? 0},
          ${row.schema_score ?? 0},
          ${row.direct_score ?? 0},
          ${row.has_llms_txt ?? false},
          ${row.has_faqpage ?? false},
          ${row.has_schema ?? false},
          ${row.errors_count ?? 0},
          ${JSON.stringify(row.top_errors ?? [])},
          ${row.last_checked_at ?? new Date().toISOString()},
          ${row.created_at ?? new Date().toISOString()}
        )
        ON CONFLICT (domain) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          category = EXCLUDED.category,
          llm_score = EXCLUDED.llm_score,
          seo_score = EXCLUDED.seo_score,
          schema_score = EXCLUDED.schema_score,
          direct_score = EXCLUDED.direct_score,
          has_llms_txt = EXCLUDED.has_llms_txt,
          has_faqpage = EXCLUDED.has_faqpage,
          has_schema = EXCLUDED.has_schema,
          errors_count = EXCLUDED.errors_count,
          top_errors = EXCLUDED.top_errors,
          last_checked_at = EXCLUDED.last_checked_at
      `;
      upserted++;
    }

    console.log(`✅ Upserted ${upserted} rows into local geo_rating`);

    // 6. Verify
    const [{ cnt }] = await sql`SELECT count(*)::int as cnt FROM geo_rating`;
    console.log(`✅ Total rows in local geo_rating: ${cnt}`);

    const sample = await sql`SELECT domain, llm_score, seo_score FROM geo_rating ORDER BY llm_score DESC LIMIT 5`;
    console.log('📊 Top 5:');
    for (const r of sample) {
      console.log(`   ${r.domain} — llm: ${r.llm_score}, seo: ${r.seo_score}`);
    }

    console.log('\n🎉 Done!');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
