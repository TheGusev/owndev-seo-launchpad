/**
 * Главный builder AI Developer Pack: собирает ZIP с 8+ артефактами,
 * считает sha256, опционально сохраняет в БД (ai_developer_packs).
 *
 * Gate: блокирует экспорт, если preflight_score < publishThreshold (default 90).
 */
import JSZip from 'jszip';
import crypto from 'node:crypto';
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import type {
  AiPackInput,
  AiPackManifest,
  AiPackResult,
} from './types.js';
import { generateSuperPrompt } from './superPrompt.js';
import { generateAcceptanceChecklist, generateReadmeForAI } from './checklist.js';
import { ENGINE_VERSION } from '../FormulaV2/blueprintBuilder.js';

const DEFAULT_THRESHOLD = 90;

export class PreflightGateError extends Error {
  constructor(public score: number, public threshold: number) {
    super(`Preflight gate: score ${score} < threshold ${threshold} — pack export blocked`);
    this.name = 'PreflightGateError';
  }
}

export async function buildAiDeveloperPack(
  input: AiPackInput,
  opts: { sessionId?: string | null; persist?: boolean } = {},
): Promise<AiPackResult> {
  const threshold = input.publishThreshold ?? DEFAULT_THRESHOLD;
  const score = input.blueprint.preflight.score;
  if (score < threshold) {
    throw new PreflightGateError(score, threshold);
  }

  const businessName = input.businessName || pickBrand(input.siteUrl || '');
  const siteUrl = input.siteUrl || '';
  const zip = new JSZip();

  // 1. super_prompt.txt
  const superPrompt = generateSuperPrompt({
    blueprint: input.blueprint,
    audit: input.audit,
    recovery: input.recovery,
    businessName,
    siteUrl,
  });
  zip.file('super_prompt.txt', superPrompt);

  // 2. routes.json
  const routes = input.blueprint.pages.map((p) => ({
    page_type: p.page_type,
    pattern: p.url_pattern,
    examples: p.examples,
    contract_id: p.contract_id,
  }));
  zip.file('routes.json', JSON.stringify(routes, null, 2));

  // 3. page_contracts.json — расширенные требования по каждой странице
  const contracts = input.blueprint.pages.map((p) => ({
    page_type: p.page_type,
    contract_id: p.contract_id,
    url_pattern: p.url_pattern,
    h1_template: p.h1_template,
    title_template: p.title_template,
    meta_description_template: p.meta_description_template,
    required_schemas: p.required_schemas,
    required_blocks: p.required_blocks,
    recommended_blocks: p.recommended_blocks,
    notes_ru: p.notes_ru,
  }));
  zip.file('page_contracts.json', JSON.stringify(contracts, null, 2));

  // 4. schema_pack.json — готовые JSON-LD
  const schemaPack = {
    global: input.blueprint.global_schemas,
    recovery_patches: input.recovery?.schema_patches ?? [],
  };
  zip.file('schema_pack.json', JSON.stringify(schemaPack, null, 2));

  // 5. metadata.json
  const metadata = {
    pack_version: '1.0.0',
    engine_version: input.blueprint.engine_version || ENGINE_VERSION,
    project_type_code: input.blueprint.project_type_code,
    preflight_score: score,
    publishable: input.blueprint.preflight.publishable,
    business_name: businessName,
    site_url: siteUrl,
    pages_count: input.blueprint.pages.length,
    has_audit: !!input.audit,
    has_recovery: !!input.recovery,
    generated_at: new Date().toISOString(),
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // 6. acceptance_checklist.md
  zip.file('acceptance_checklist.md', generateAcceptanceChecklist(input.blueprint));

  // 7. README_for_AI.md
  zip.file('README_for_AI.md', generateReadmeForAI(input.blueprint, businessName));

  // 8. llms.txt
  zip.file('llms.txt', input.blueprint.llms_txt || '');

  // 9. robots.txt
  zip.file('robots.txt', input.blueprint.robots_txt || '');

  // 10. sitemap.xml
  zip.file('sitemap.xml', input.blueprint.sitemap_skeleton || '');

  // 11. audit_report.json (если есть)
  if (input.audit) {
    zip.file('audit_report.json', JSON.stringify(input.audit, null, 2));
  }
  // 12. recovery_blueprint.json (если есть)
  if (input.recovery) {
    zip.file('recovery_blueprint.json', JSON.stringify(input.recovery, null, 2));
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const zip_sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');

  // build manifest
  const manifestFiles: AiPackManifest['files'] = [];
  zip.forEach((relPath, file) => {
    if (file.dir) return;
    manifestFiles.push({ name: relPath, size: 0 });
  });
  const manifest: AiPackManifest = {
    files: manifestFiles,
    total_size: zipBuffer.length,
    generated_at: new Date().toISOString(),
    engine_version: ENGINE_VERSION,
  };

  let pack_id: string | null = null;
  if (opts.persist !== false) {
    try {
      const inlineBlob = zipBuffer.length < 5 * 1024 * 1024 ? zipBuffer : null;
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO ai_developer_packs (
          session_id, audit_id, recovery_id, project_type_code, url,
          preflight_score, zip_size_bytes, zip_sha256, manifest, zip_blob
        ) VALUES (
          ${opts.sessionId ?? null},
          ${input.audit?.audit_id ?? null},
          ${input.recovery?.recovery_id ?? null},
          ${input.blueprint.project_type_code},
          ${siteUrl || null},
          ${score},
          ${zipBuffer.length},
          ${zip_sha256},
          ${sql.json(manifest as any)},
          ${inlineBlob}
        )
        RETURNING id
      `;
      pack_id = row.id;
    } catch (e: any) {
      logger.warn('AI_PACK', `persist failed: ${e?.message || e}`);
    }
  }

  return {
    pack_id,
    zip_buffer: zipBuffer,
    manifest,
    preflight_score: score,
    publishable: score >= threshold,
    zip_sha256,
  };
}

function pickBrand(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.split('.')[0] || 'brand';
  } catch {
    return 'brand';
  }
}
