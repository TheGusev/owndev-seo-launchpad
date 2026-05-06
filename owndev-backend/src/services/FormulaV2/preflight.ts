/**
 * Preflight Audit — verify a Blueprint v2 against its Page Contracts.
 *
 * The blueprint declares pages, schemas, blocks, and meta — Preflight checks
 * that each page satisfies its contract's hard requirements.
 *
 * Output:
 *   - score (0..100): weighted compliance
 *   - violations: list of failed contract rules
 *   - publishable (score >= 90): blocks the export until satisfied
 *
 * This is the gate between "draft blueprint" and "shippable AI Developer Pack".
 */
import type {
  BlueprintV2,
  BlueprintPagePlan,
  PageContract,
  PreflightReport,
  PreflightViolation,
  ProjectTypeCode,
} from '../../types/formulaV2.js';
import { listPageContracts } from './repository.js';

// Severity → weight loss (per violation)
const SEVERITY_WEIGHT: Record<PreflightViolation['severity'], number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
};

const PUBLISH_THRESHOLD = 90;

function checkPage(plan: BlueprintPagePlan, contract: PageContract): PreflightViolation[] {
  const out: PreflightViolation[] = [];

  // 1. Required schemas present
  const planSchemas = new Set(plan.required_schemas);
  for (const s of contract.required_schemas) {
    if (!planSchemas.has(s)) {
      out.push({
        contract_id: contract.id,
        page_type: contract.page_type,
        rule: 'required_schema_missing',
        severity: 'critical',
        expected: s,
        actual: Array.from(planSchemas),
        human_message: `На ${contract.page_type} обязательна schema ${s}`,
      });
    }
  }

  // 2. Required blocks present
  const planBlocks = new Set(plan.required_blocks);
  for (const b of contract.required_blocks) {
    if (!planBlocks.has(b)) {
      out.push({
        contract_id: contract.id,
        page_type: contract.page_type,
        rule: 'required_block_missing',
        severity: 'high',
        expected: b,
        actual: Array.from(planBlocks),
        human_message: `На ${contract.page_type} обязателен блок «${b}»`,
      });
    }
  }

  // 3. Forbidden blocks absent
  const forbidden = new Set(contract.forbidden_blocks);
  for (const b of plan.required_blocks) {
    if (forbidden.has(b)) {
      out.push({
        contract_id: contract.id,
        page_type: contract.page_type,
        rule: 'forbidden_block_present',
        severity: 'high',
        expected: null,
        actual: b,
        human_message: `На ${contract.page_type} запрещён блок «${b}»`,
      });
    }
  }

  // 4. H1 pattern
  if (contract.required_h1_pattern && plan.h1_template) {
    try {
      const re = new RegExp(contract.required_h1_pattern);
      // We test against a "rendered example" — replace placeholders with placeholder
      // text so the regex can validate structural intent, not concrete value.
      const sampleH1 = plan.h1_template.replace(/\{\{[^}]+\}\}/g, 'Пример');
      if (!re.test(sampleH1)) {
        out.push({
          contract_id: contract.id,
          page_type: contract.page_type,
          rule: 'h1_pattern_mismatch',
          severity: 'medium',
          expected: contract.required_h1_pattern,
          actual: plan.h1_template,
          human_message: `H1-шаблон «${plan.h1_template}» не соответствует паттерну ${contract.required_h1_pattern}`,
        });
      }
    } catch {
      // Bad regex in DB — log soft warning, don't crash
      out.push({
        contract_id: contract.id,
        page_type: contract.page_type,
        rule: 'invalid_contract_regex',
        severity: 'low',
        expected: contract.required_h1_pattern,
        actual: null,
        human_message: 'Регулярка контракта невалидна (исправить в админке)',
      });
    }
  }

  // 5. Title pattern
  if (contract.required_title_pattern && plan.title_template) {
    try {
      const re = new RegExp(contract.required_title_pattern);
      const sample = plan.title_template.replace(/\{\{[^}]+\}\}/g, 'Пример');
      if (!re.test(sample)) {
        out.push({
          contract_id: contract.id,
          page_type: contract.page_type,
          rule: 'title_pattern_mismatch',
          severity: 'medium',
          expected: contract.required_title_pattern,
          actual: plan.title_template,
          human_message: `Title не соответствует паттерну (длина 30-60 символов / структура)`,
        });
      }
    } catch {
      // ignore — handled above
    }
  }

  // 6. Meta description length placeholder check (only when concrete text)
  const metaSample = plan.meta_description_template?.replace(/\{\{[^}]+\}\}/g, 'X'.repeat(20));
  if (metaSample && (metaSample.length < contract.required_meta_desc_min || metaSample.length > contract.required_meta_desc_max)) {
    out.push({
      contract_id: contract.id,
      page_type: contract.page_type,
      rule: 'meta_description_length',
      severity: 'low',
      expected: `${contract.required_meta_desc_min}-${contract.required_meta_desc_max} chars`,
      actual: metaSample.length,
      human_message: `Meta description должно быть ${contract.required_meta_desc_min}–${contract.required_meta_desc_max} символов (сейчас ~${metaSample.length})`,
    });
  }

  return out;
}

export async function runPreflight(blueprint: BlueprintV2): Promise<PreflightReport> {
  const contracts = await listPageContracts(blueprint.project_type_code as ProjectTypeCode);
  const contractByType = new Map<string, PageContract>();
  for (const c of contracts) contractByType.set(c.page_type, c);

  const violations: PreflightViolation[] = [];
  let contracts_checked = 0;
  let contracts_passed = 0;

  for (const plan of blueprint.pages) {
    const contract = contractByType.get(plan.page_type);
    if (!contract) continue;
    contracts_checked++;
    const v = checkPage(plan, contract);
    if (v.length === 0) contracts_passed++;
    violations.push(...v);
  }

  // Score: start at 100, subtract weighted severity, clamp.
  let score = 100;
  for (const v of violations) {
    score -= SEVERITY_WEIGHT[v.severity];
  }
  score = Math.max(0, Math.min(100, score));

  return {
    project_type_code: blueprint.project_type_code as ProjectTypeCode,
    contracts_checked,
    contracts_passed,
    violations,
    score,
    publishable: score >= PUBLISH_THRESHOLD,
    generated_at: new Date().toISOString(),
  };
}

export const PREFLIGHT_PUBLISH_THRESHOLD = PUBLISH_THRESHOLD;
