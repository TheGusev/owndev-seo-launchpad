/**
 * services/developerPack — repository.
 *
 * Persists pack artifacts and export modes (migration 034).
 */
import { sql } from '../../db/client.js';
import type { SuperPromptPack, ExportMode, PlatformTarget } from './types.js';

export async function savePackArtifact(opts: {
  formula_job_id: string | null;
  pack: SuperPromptPack;
  mode: ExportMode;
  platform_target: PlatformTarget | null;
  zip_size_bytes: number | null;
  zip_storage_key: string | null;
}): Promise<number> {
  const rows = await sql<Array<{ id: number }>>`
    INSERT INTO pack_artifacts (
      formula_job_id, version, engine_version, generated_at,
      mode, platform_target, pack_json, zip_size_bytes, zip_storage_key
    )
    VALUES (
      ${opts.formula_job_id}, ${opts.pack.version}, ${opts.pack.engine_version ?? 'v3'},
      ${opts.pack.generated_at},
      ${opts.mode}, ${opts.platform_target},
      ${sql.json(opts.pack as any)},
      ${opts.zip_size_bytes}, ${opts.zip_storage_key}
    )
    RETURNING id
  `;
  return rows[0].id;
}

export async function loadLatestPack(formulaJobId: string): Promise<SuperPromptPack | null> {
  const rows = await sql<Array<{ pack_json: SuperPromptPack }>>`
    SELECT pack_json
    FROM pack_artifacts
    WHERE formula_job_id = ${formulaJobId}
    ORDER BY generated_at DESC
    LIMIT 1
  `;
  return rows.length ? rows[0].pack_json : null;
}
