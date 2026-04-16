import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import type { RulesConfig, TemplateConfig } from '../../types/siteFormula.js';
import { logger } from '../../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = resolve(__dirname, '../../../config');

let cachedRules: RulesConfig | null = null;
let cachedTemplate: TemplateConfig | null = null;
let cachedRulesChecksum: string | null = null;
let cachedTemplateChecksum: string | null = null;

function computeChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

function loadJsonFile<T>(filename: string): { data: T; checksum: string } {
  const filePath = resolve(CONFIG_DIR, filename);
  const raw = readFileSync(filePath, 'utf-8');
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`[ConfigLoader] Invalid JSON in ${filename}: ${err.message}`);
  }
  if (!parsed.version) {
    throw new Error(`[ConfigLoader] Missing 'version' in ${filename}`);
  }
  return { data: parsed as T, checksum: computeChecksum(raw) };
}

export function loadRules(forceReload = false): RulesConfig {
  if (cachedRules && !forceReload) return cachedRules;
  const { data, checksum } = loadJsonFile<RulesConfig>('rules.v1.json');
  if (!data.rules || !Array.isArray(data.rules)) {
    throw new Error('[ConfigLoader] rules.v1.json: missing "rules" array');
  }
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('[ConfigLoader] rules.v1.json: missing "questions" array');
  }
  cachedRules = data;
  cachedRulesChecksum = checksum;
  logger.info('CONFIG', `Loaded rules.v1.json v${data.version} [${checksum}]`);
  return data;
}

export function loadTemplate(forceReload = false): TemplateConfig {
  if (cachedTemplate && !forceReload) return cachedTemplate;
  const { data, checksum } = loadJsonFile<TemplateConfig>('blueprint-template.v1.json');
  if (!data.sections || !Array.isArray(data.sections)) {
    throw new Error('[ConfigLoader] blueprint-template.v1.json: missing "sections" array');
  }
  cachedTemplate = data;
  cachedTemplateChecksum = checksum;
  logger.info('CONFIG', `Loaded blueprint-template.v1.json v${data.version} [${checksum}]`);
  return data;
}

export function getRulesVersion(): string {
  return cachedRules?.version ?? 'unknown';
}

export function getTemplateVersion(): string {
  return cachedTemplate?.version ?? 'unknown';
}

export function getRulesChecksum(): string {
  return cachedRulesChecksum ?? 'unknown';
}

export function getTemplateChecksum(): string {
  return cachedTemplateChecksum ?? 'unknown';
}

export function validateVersionMatch(): boolean {
  if (!cachedRules || !cachedTemplate) return false;
  // For v1 both should be 1.0.0
  return cachedRules.version === cachedTemplate.version;
}
