/**
 * Schema Registry — fills JSON-LD templates with concrete values.
 *
 * Templates use {{placeholder}} syntax and live in formula_schema_templates.
 * Variables are filled from a flat record. Missing required variables are
 * reported (not auto-defaulted) so callers can ask for them or skip the schema.
 *
 * For arrays (e.g. faq_items, breadcrumb_items) callers pass already-shaped
 * sub-objects — the registry just substitutes the JSON-stringified array.
 */
import { getSchemaTemplate, listSchemaTemplates } from './repository.js';

export interface RenderResult {
  schema_type: string;
  variant: string;
  rendered: Record<string, any> | null;
  missing_required: string[];
  filled_optional: string[];
  filled_required: string[];
}

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

function deepFill(node: any, vars: Record<string, any>, missing: Set<string>, required: Set<string>): any {
  if (typeof node === 'string') {
    let touched = false;
    const replaced = node.replace(PLACEHOLDER_RE, (_, name: string) => {
      touched = true;
      if (vars[name] === undefined || vars[name] === null || vars[name] === '') {
        if (required.has(name)) missing.add(name);
        return ''; // empty string for optional
      }
      const v = vars[name];
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
    // If the entire string is a single placeholder for a non-string variable,
    // promote to the raw value (so arrays/objects don't end up stringified).
    const singleMatch = node.match(/^\{\{(\w+)\}\}$/);
    if (singleMatch && touched) {
      const v = vars[singleMatch[1]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return replaced;
  }
  if (Array.isArray(node)) {
    return node.map((it) => deepFill(it, vars, missing, required));
  }
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = deepFill(v, vars, missing, required);
    }
    return out;
  }
  return node;
}

function pruneEmpty(node: any): any {
  // Remove keys whose value is '' or null after fill (optional fields not provided).
  if (Array.isArray(node)) {
    return node.map(pruneEmpty).filter((v) => v !== '' && v !== null);
  }
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      const cleaned = pruneEmpty(v);
      if (cleaned === '' || cleaned === null) continue;
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (cleaned && typeof cleaned === 'object' && Object.keys(cleaned).length === 0) continue;
      out[k] = cleaned;
    }
    return out;
  }
  return node;
}

export async function renderSchema(
  schemaType: string,
  vars: Record<string, any>,
  variant = 'default',
): Promise<RenderResult> {
  const template = await getSchemaTemplate(schemaType, variant);
  if (!template) {
    return {
      schema_type: schemaType,
      variant,
      rendered: null,
      missing_required: ['__template_not_found__'],
      filled_optional: [],
      filled_required: [],
    };
  }

  const required = new Set(template.required_vars);
  const missing = new Set<string>();
  const filled = deepFill(template.template_json, vars, missing, required);
  const rendered = pruneEmpty(filled);

  const filled_required = template.required_vars.filter((v) => !missing.has(v));
  const filled_optional = template.optional_vars.filter(
    (v) => vars[v] !== undefined && vars[v] !== null && vars[v] !== '',
  );

  return {
    schema_type: schemaType,
    variant,
    rendered: missing.size > 0 ? null : rendered,
    missing_required: Array.from(missing),
    filled_optional,
    filled_required,
  };
}

export async function renderManySchemas(
  schemaTypes: string[],
  vars: Record<string, any>,
): Promise<RenderResult[]> {
  return Promise.all(schemaTypes.map((t) => renderSchema(t, vars)));
}

export async function listAvailableSchemas(): Promise<string[]> {
  const all = await listSchemaTemplates();
  return Array.from(new Set(all.map((t) => t.schema_type)));
}
