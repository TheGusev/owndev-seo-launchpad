/**
 * pageContracts repository — load V3 contracts from DB.
 *
 * Мост v1 → v3:
 *   listV3Contracts принимает опциональный tierSize. Если задан — выбираются
 *   контракты с tier_size = $tier ИЛИ tier_size = 'all' (универсальные).
 *   Если tierSize не задан — выбираются все контракты (legacy-поведение,
 *   обратная совместимость с теми вызовами, где engine_state ещё не пробрасывается).
 */
import { sql } from '../../db/client.js';
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { PageContractRow } from './types.js';
import type { TierSize } from '../strategy/types.js';

export async function listV3Contracts(
  projectCode: ProjectTypeCodeV3,
  tierSize?: TierSize,
): Promise<PageContractRow[]> {
  // Без фильтра по tier_size — legacy-поведение (выбираем всё).
  if (!tierSize || tierSize === 'all') {
    const rows = await sql<PageContractRow[]>`
      SELECT id::text, project_type_code, page_type, version,
             required_h1_pattern, required_title_pattern,
             required_meta_desc_min, required_meta_desc_max,
             required_schemas, required_blocks, forbidden_blocks,
             min_word_count, recommended_blocks, recommended_schemas,
             must_be_indexable, must_be_in_sitemap, canonical_required,
             notes_ru,
             h1_max_chars, title_max_chars,
             intro_answer_words_min, intro_answer_words_max, faq_min_items,
             required_commercial_signals, schema_graph_root, schema_graph_required, engine_version,
             tier_size
      FROM formula_page_contracts
      WHERE project_type_code = ${projectCode}
        AND version = '3.0.0'
        AND is_active = TRUE
      ORDER BY page_type
    `;
    return rows as unknown as PageContractRow[];
  }

  // С фильтром по tier_size — берём контракты для конкретного размера + универсальные.
  const rows = await sql<PageContractRow[]>`
    SELECT id::text, project_type_code, page_type, version,
           required_h1_pattern, required_title_pattern,
           required_meta_desc_min, required_meta_desc_max,
           required_schemas, required_blocks, forbidden_blocks,
           min_word_count, recommended_blocks, recommended_schemas,
           must_be_indexable, must_be_in_sitemap, canonical_required,
           notes_ru,
           h1_max_chars, title_max_chars,
           intro_answer_words_min, intro_answer_words_max, faq_min_items,
           required_commercial_signals, schema_graph_root, schema_graph_required, engine_version,
           tier_size
    FROM formula_page_contracts
    WHERE project_type_code = ${projectCode}
      AND version = '3.0.0'
      AND is_active = TRUE
      AND (tier_size = ${tierSize} OR tier_size = 'all')
    ORDER BY page_type
  `;
  return rows as unknown as PageContractRow[];
}

export async function getV3Contract(
  projectCode: ProjectTypeCodeV3,
  pageType: string,
): Promise<PageContractRow | null> {
  const rows = await sql<PageContractRow[]>`
    SELECT id::text, project_type_code, page_type, version,
           required_h1_pattern, required_title_pattern,
           required_meta_desc_min, required_meta_desc_max,
           required_schemas, required_blocks, forbidden_blocks,
           min_word_count, recommended_blocks, recommended_schemas,
           must_be_indexable, must_be_in_sitemap, canonical_required,
           notes_ru,
           h1_max_chars, title_max_chars,
           intro_answer_words_min, intro_answer_words_max, faq_min_items,
           required_commercial_signals, schema_graph_root, schema_graph_required, engine_version,
           tier_size
    FROM formula_page_contracts
    WHERE project_type_code = ${projectCode}
      AND page_type = ${pageType}
      AND version = '3.0.0'
      AND is_active = TRUE
    LIMIT 1
  `;
  return (rows[0] as unknown as PageContractRow) ?? null;
}
