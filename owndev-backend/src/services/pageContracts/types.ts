/**
 * services/pageContracts — V3 types.
 */

import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';

export interface PageContractRow {
  id: string;
  project_type_code: ProjectTypeCodeV3;
  page_type: string;
  version: string;
  required_h1_pattern: string | null;
  required_title_pattern: string | null;
  required_meta_desc_min: number;
  required_meta_desc_max: number;
  required_schemas: string[];
  required_blocks: string[];
  forbidden_blocks: string[];
  min_word_count: number;
  recommended_blocks: string[];
  recommended_schemas: string[];
  must_be_indexable: boolean;
  must_be_in_sitemap: boolean;
  canonical_required: boolean;
  notes_ru: string | null;
  // V3
  h1_max_chars: number;
  title_max_chars: number;
  intro_answer_words_min: number;
  intro_answer_words_max: number;
  faq_min_items: number;
  required_commercial_signals: string[];
  schema_graph_root: string | null;
  schema_graph_required: string[];
  engine_version: string;
  // ───── Мост v1 → v3 ─────
  // tier_size — размер проекта, на который рассчитан контракт.
  // Совпадает с ProjectClass в v1 (start | growth | scale) + 'all' — контракт подходит любому размеру.
  // Миграция 038 добавила столбец с DEFAULT 'all', поэтому существующие seed-строки не сломаются.
  tier_size: 'start' | 'growth' | 'scale' | 'all';
}

export interface PageRequirement {
  page_type: string;
  url_pattern: string;
  h1_max_chars: number;
  title_max_chars: number;
  intro_answer_words: { min: number; max: number };
  faq_min_items: number;
  required_blocks: string[];
  required_commercial_signals: string[];
  required_schema_graph: string[];
  schema_graph_root: string | null;
  notes_ru: string | null;
}

export interface GeneratedPageContract {
  page_type: string;
  url_pattern: string;
  h1_template: string;
  title_template: string;
  meta_description_template: string;
  intro_answer_template: string;
  faq_questions: string[];
  required_blocks: string[];
  required_commercial_signals: string[];
  required_schema_graph: string[];
  notes_ru: string | null;
}
