/**
 * FormulaV2 — repository layer.
 *
 * Read-only DB access for project_types, page_contracts, schema_templates.
 * In-memory caching with TTL because these tables are seeded once and rarely
 * change — refetching on every request is wasteful.
 */
import { sql } from '../../db/client.js';
import type {
  ProjectType,
  ProjectTypeCode,
  PageContract,
  SchemaTemplate,
} from '../../types/formulaV2.js';

const CACHE_TTL_MS = 60_000; // 1 minute — short enough for hot reload during dev

interface Cache<T> {
  data: T | null;
  loadedAt: number;
}

const projectTypesCache: Cache<ProjectType[]> = { data: null, loadedAt: 0 };
const pageContractsCache: Map<ProjectTypeCode, Cache<PageContract[]>> = new Map();
const schemaTemplatesCache: Cache<SchemaTemplate[]> = { data: null, loadedAt: 0 };

const isFresh = (c: { loadedAt: number }) => Date.now() - c.loadedAt < CACHE_TTL_MS;

// ─── Project types ────────────────────────────────────────────
export async function listProjectTypes(): Promise<ProjectType[]> {
  if (projectTypesCache.data && isFresh(projectTypesCache)) {
    return projectTypesCache.data;
  }
  const rows = await sql<ProjectType[]>`
    SELECT
      code, name_ru, name_en, group_code, description,
      default_intents, default_layers, required_schemas,
      is_active, sort_order
    FROM formula_project_types
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, code ASC
  `;
  projectTypesCache.data = rows as unknown as ProjectType[];
  projectTypesCache.loadedAt = Date.now();
  return projectTypesCache.data;
}

export async function getProjectType(code: ProjectTypeCode): Promise<ProjectType | null> {
  const all = await listProjectTypes();
  return all.find((t) => t.code === code) ?? null;
}

// ─── Page contracts ───────────────────────────────────────────
export async function listPageContracts(typeCode: ProjectTypeCode): Promise<PageContract[]> {
  const cached = pageContractsCache.get(typeCode);
  if (cached?.data && isFresh(cached)) return cached.data;

  const rows = await sql<PageContract[]>`
    SELECT
      id, project_type_code, page_type, version,
      required_h1_pattern, required_title_pattern,
      required_meta_desc_min, required_meta_desc_max,
      required_schemas, required_blocks, forbidden_blocks,
      min_word_count, recommended_blocks, recommended_schemas,
      must_be_indexable, must_be_in_sitemap, canonical_required,
      notes_ru, is_active
    FROM formula_page_contracts
    WHERE project_type_code = ${typeCode}
      AND is_active = TRUE
    ORDER BY page_type ASC
  `;
  const contracts = rows as unknown as PageContract[];
  pageContractsCache.set(typeCode, { data: contracts, loadedAt: Date.now() });
  return contracts;
}

export async function getPageContract(
  typeCode: ProjectTypeCode,
  pageType: string,
): Promise<PageContract | null> {
  const all = await listPageContracts(typeCode);
  return all.find((c) => c.page_type === pageType) ?? null;
}

// ─── Schema templates ─────────────────────────────────────────
export async function listSchemaTemplates(): Promise<SchemaTemplate[]> {
  if (schemaTemplatesCache.data && isFresh(schemaTemplatesCache)) {
    return schemaTemplatesCache.data;
  }
  const rows = await sql<SchemaTemplate[]>`
    SELECT
      id, schema_type, variant, version,
      template_json, required_vars, optional_vars,
      description_ru, is_active
    FROM formula_schema_templates
    WHERE is_active = TRUE
    ORDER BY schema_type ASC, variant ASC
  `;
  schemaTemplatesCache.data = rows as unknown as SchemaTemplate[];
  schemaTemplatesCache.loadedAt = Date.now();
  return schemaTemplatesCache.data;
}

export async function getSchemaTemplate(
  schemaType: string,
  variant = 'default',
): Promise<SchemaTemplate | null> {
  const all = await listSchemaTemplates();
  return (
    all.find((t) => t.schema_type === schemaType && t.variant === variant) ??
    all.find((t) => t.schema_type === schemaType && t.variant === 'default') ??
    null
  );
}

// ─── Cache reset (test / admin) ───────────────────────────────
export function resetCache(): void {
  projectTypesCache.data = null;
  projectTypesCache.loadedAt = 0;
  pageContractsCache.clear();
  schemaTemplatesCache.data = null;
  schemaTemplatesCache.loadedAt = 0;
}
