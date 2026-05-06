/**
 * services/developerPack — ajv validator.
 *
 * Loads docs/super_prompt_pack.schema.json once and validates pack
 * objects against it. Returns rich error info.
 */

import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';

// ajv ships CommonJS — Node ESM with esModuleInterop sometimes returns the
// module namespace. Normalise to a callable / constructable function.
const Ajv: any = (AjvModule as any).default ?? AjvModule;
const addFormats: any = (addFormatsModule as any).default ?? addFormatsModule;
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SuperPromptPack } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

let cachedValidator: ((data: unknown) => boolean) & { errors?: any[] } | null = null;

function getValidator(): NonNullable<typeof cachedValidator> {
  if (cachedValidator) return cachedValidator;
  const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: true });
  addFormats(ajv);

  // Resolve path: works from src or compiled dist (paths differ — try both)
  const candidates = [
    resolve(__dirname, '../../../../docs/super_prompt_pack.schema.json'),
    resolve(__dirname, '../../../docs/super_prompt_pack.schema.json'),
    resolve(process.cwd(), 'docs/super_prompt_pack.schema.json'),
    resolve(process.cwd(), '../docs/super_prompt_pack.schema.json'),
  ];
  let schemaText: string | null = null;
  for (const c of candidates) {
    try {
      schemaText = readFileSync(c, 'utf8');
      break;
    } catch {
      // try next
    }
  }
  if (!schemaText) {
    throw new Error('super_prompt_pack.schema.json not found in any candidate path');
  }
  const schema = JSON.parse(schemaText);
  cachedValidator = ajv.compile(schema) as NonNullable<typeof cachedValidator>;
  return cachedValidator!;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string; params?: Record<string, any> }>;
}

export function validatePack(pack: SuperPromptPack | unknown): ValidationResult {
  const validator = getValidator();
  const valid = validator(pack);
  if (valid) return { valid: true, errors: [] };
  const errors = (validator.errors ?? []).map((e: any) => ({
    path: e.instancePath || e.schemaPath,
    message: e.message ?? 'invalid',
    params: e.params as Record<string, any>,
  }));
  return { valid: false, errors };
}

export function assertValidPack(pack: SuperPromptPack | unknown): SuperPromptPack {
  const result = validatePack(pack);
  if (!result.valid) {
    const summary = result.errors
      .slice(0, 8)
      .map((e) => `  ${e.path} → ${e.message}`)
      .join('\n');
    throw new Error(`super_prompt_pack validation failed:\n${summary}`);
  }
  return pack as SuperPromptPack;
}
