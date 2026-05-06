/**
 * AI Developer Pack (Module 9) — публичные типы.
 *
 * Pack — это ZIP-архив с 8+ артефактами, который скармливается
 * любому AI-кодеру (Claude/GPT/Cursor/etc.) и достаточен для
 * реализации сайта по нашей формуле.
 */
import type { ProjectTypeCode, BlueprintV2 } from '../../types/formulaV2.js';
import type { AuditReport, RecoveryBlueprint } from '../AuditEngine/types.js';

export interface AiPackInput {
  blueprint: BlueprintV2;
  audit?: AuditReport | null;
  recovery?: RecoveryBlueprint | null;
  /** override preflight score gate (default 90) */
  publishThreshold?: number;
  /** carry the project type explicitly when blueprint may not fully specify it */
  projectTypeCode?: ProjectTypeCode;
  /** root site url для llms.txt / robots.txt */
  siteUrl?: string;
  businessName?: string;
}

export interface AiPackManifest {
  files: Array<{ name: string; size: number; sha256?: string }>;
  total_size: number;
  generated_at: string;
  engine_version: string;
}

export interface AiPackResult {
  pack_id: string | null;
  zip_buffer: Buffer;
  manifest: AiPackManifest;
  preflight_score: number;
  publishable: boolean;
  zip_sha256: string;
}
