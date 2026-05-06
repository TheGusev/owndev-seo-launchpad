-- Migration 033 — V3 Preflight Rules (4 axes × P0/P1/P2 levels)
-- =============================================================
-- Adds the rule engine table that drives preflight gating.
-- Each rule belongs to one axis (SEO / DIRECT / SCHEMA / AI_LLM)
-- and one severity level (P0 = blocker, P1 = required, P2 = recommended).
-- Threshold per axis (V3): SEO ≥ 85, DIRECT ≥ 90, SCHEMA = 100, AI_LLM ≥ 85.
-- Failing any P0 fails the whole gate regardless of axis score.

BEGIN;

CREATE TABLE IF NOT EXISTS preflight_rules (
  id              SERIAL PRIMARY KEY,
  rule_code       TEXT NOT NULL UNIQUE,
  axis            TEXT NOT NULL CHECK (axis IN ('SEO', 'DIRECT', 'SCHEMA', 'AI_LLM')),
  severity        TEXT NOT NULL CHECK (severity IN ('P0', 'P1', 'P2')),
  weight          INTEGER NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  applies_to      TEXT[] NOT NULL DEFAULT ARRAY['*'],   -- project_type_codes or ['*']
  page_types      TEXT[] NOT NULL DEFAULT ARRAY['*'],   -- page_types or ['*']
  description_ru  TEXT NOT NULL,
  remediation_ru  TEXT NOT NULL,
  doc_url         TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  engine_version  TEXT NOT NULL DEFAULT 'v3',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preflight_rules_axis ON preflight_rules(axis);
CREATE INDEX IF NOT EXISTS idx_preflight_rules_severity ON preflight_rules(severity);
CREATE INDEX IF NOT EXISTS idx_preflight_rules_active ON preflight_rules(active) WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS preflight_results (
  id              SERIAL PRIMARY KEY,
  formula_job_id  TEXT,
  url             TEXT NOT NULL,
  axis_seo        INTEGER NOT NULL CHECK (axis_seo BETWEEN 0 AND 100),
  axis_direct     INTEGER NOT NULL CHECK (axis_direct BETWEEN 0 AND 100),
  axis_schema     INTEGER NOT NULL CHECK (axis_schema BETWEEN 0 AND 100),
  axis_ai_llm     INTEGER NOT NULL CHECK (axis_ai_llm BETWEEN 0 AND 100),
  total_score     INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  passed          BOOLEAN NOT NULL,
  failed_p0       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  failed_p1       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  failed_p2       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preflight_results_job ON preflight_results(formula_job_id);
CREATE INDEX IF NOT EXISTS idx_preflight_results_url ON preflight_results(url);

-- ===========================================================================
-- SEED RULES (V3) — 4 axes × P0/P1/P2
-- ===========================================================================

-- ----- SEO axis (≥ 85 to pass) --------------------------------------------
INSERT INTO preflight_rules (rule_code, axis, severity, weight, description_ru, remediation_ru) VALUES
('SEO_P0_TITLE_PRESENT',     'SEO', 'P0', 10, 'Тег <title> отсутствует или пустой',          'Добавить уникальный <title> 30-60 символов'),
('SEO_P0_H1_PRESENT',        'SEO', 'P0', 10, 'Тег <h1> отсутствует',                         'Добавить ровно один H1 на странице'),
('SEO_P0_META_DESC',         'SEO', 'P0',  8, 'Meta description отсутствует',                 'Добавить meta description 70-160 символов'),
('SEO_P0_INDEXABLE',         'SEO', 'P0', 10, 'Страница заблокирована noindex / robots',      'Убрать noindex и Disallow для целевой страницы'),
('SEO_P0_CANONICAL',         'SEO', 'P0',  6, 'Canonical отсутствует или указывает не на себя','Установить self-canonical (rel="canonical")'),
('SEO_P1_TITLE_LENGTH',      'SEO', 'P1',  4, 'Title длиннее 60 символов',                    'Сократить title до 60 символов'),
('SEO_P1_H1_LENGTH',         'SEO', 'P1',  4, 'H1 длиннее 35 символов',                       'Сократить H1 до 35 символов'),
('SEO_P1_INTRO_ANSWER',      'SEO', 'P1',  6, 'Нет intro_answer 40-80 слов в первом блоке',   'Добавить вступительный параграф 40-80 слов'),
('SEO_P1_INTERNAL_LINKS',    'SEO', 'P1',  3, 'Меньше 3 внутренних ссылок на странице',       'Добавить минимум 3 внутренние ссылки'),
('SEO_P1_IMG_ALT',           'SEO', 'P1',  3, 'У изображений отсутствует alt',                'Заполнить alt у всех значимых изображений'),
('SEO_P1_SITEMAP',           'SEO', 'P1',  4, 'Страница не в sitemap.xml',                    'Добавить URL в sitemap.xml'),
('SEO_P2_OPEN_GRAPH',        'SEO', 'P2',  2, 'Open Graph теги неполные',                     'Добавить og:title, og:description, og:image, og:url'),
('SEO_P2_LANG_ATTR',         'SEO', 'P2',  2, 'Атрибут lang на <html> отсутствует',           'Добавить <html lang="ru">'),
('SEO_P2_HREFLANG',          'SEO', 'P2',  2, 'Hreflang отсутствует для мультиязычного сайта','Добавить hreflang при наличии языковых версий')
ON CONFLICT (rule_code) DO NOTHING;

-- ----- DIRECT axis (≥ 90 to pass) -----------------------------------------
INSERT INTO preflight_rules (rule_code, axis, severity, weight, description_ru, remediation_ru) VALUES
('DIRECT_P0_PRIMARY_CTA',    'DIRECT', 'P0', 10, 'Первичный CTA отсутствует above-the-fold', 'Разместить primary CTA выше первого скролла'),
('DIRECT_P0_PHONE_CLICKABLE','DIRECT', 'P0',  8, 'Телефон не кликабельный (нет tel:)',         'Сделать телефон ссылкой <a href="tel:...">'),
('DIRECT_P0_LEAD_FORM',      'DIRECT', 'P0',  8, 'На странице нет рабочей формы захвата',     'Добавить lead form с обязательной отправкой по AJAX'),
('DIRECT_P1_TRUST_SIGNALS',  'DIRECT', 'P1',  6, 'Нет трасти-сигналов (отзывы/кейсы/гарантии)','Добавить блоки социального доказательства'),
('DIRECT_P1_PRICE_OR_CTA',   'DIRECT', 'P1',  6, 'Нет цены/диапазона или вторичного CTA',     'Указать цену либо альтернативный CTA (расчёт/консультация)'),
('DIRECT_P1_CTA_CONTRAST',   'DIRECT', 'P1',  3, 'CTA-кнопка не выделена контрастом',         'Использовать акцентный цвет с контрастом ≥4.5:1'),
('DIRECT_P1_FORM_FIELDS',    'DIRECT', 'P1',  4, 'Форма имеет более 5 обязательных полей',    'Сократить форму до 3-5 ключевых полей'),
('DIRECT_P1_THANK_YOU',      'DIRECT', 'P1',  3, 'Нет thank-you экрана / события конверсии',  'Добавить событие dataLayer.push на сабмит формы'),
('DIRECT_P2_LIVE_CHAT',      'DIRECT', 'P2',  2, 'Нет live-chat / мессенджера',                'Подключить онлайн-чат или ссылку в WhatsApp/Telegram'),
('DIRECT_P2_CALLBACK',       'DIRECT', 'P2',  2, 'Нет виджета "перезвоним"',                   'Подключить callback-виджет'),
('DIRECT_P2_BREADCRUMBS',    'DIRECT', 'P2',  2, 'Нет хлебных крошек',                         'Добавить навигационные хлебные крошки')
ON CONFLICT (rule_code) DO NOTHING;

-- ----- SCHEMA axis (= 100 to pass) ----------------------------------------
INSERT INTO preflight_rules (rule_code, axis, severity, weight, description_ru, remediation_ru) VALUES
('SCHEMA_P0_JSONLD_PRESENT', 'SCHEMA', 'P0', 10, 'Нет JSON-LD на странице',                    'Добавить JSON-LD согласно verticalVariants'),
('SCHEMA_P0_GRAPH_ROOT',     'SCHEMA', 'P0', 10, 'Отсутствует корневой объект графа (@graph)', 'Объединить сущности в @graph через @id'),
('SCHEMA_P0_REQUIRED_TYPES', 'SCHEMA', 'P0', 10, 'Не все required schema-типы присутствуют',   'Добавить требуемые типы для page_type'),
('SCHEMA_P0_VALID_JSON',     'SCHEMA', 'P0', 10, 'JSON-LD не парсится / содержит ошибки',      'Исправить синтаксис JSON-LD'),
('SCHEMA_P1_RICH_RESULTS',   'SCHEMA', 'P1',  5, 'Schema невалидна для Rich Results',          'Заполнить required-поля по валидатору Google'),
('SCHEMA_P1_BREADCRUMB',     'SCHEMA', 'P1',  3, 'Нет BreadcrumbList',                         'Добавить BreadcrumbList на внутренние страницы'),
('SCHEMA_P1_SAMEAS',         'SCHEMA', 'P1',  3, 'У Organization нет sameAs (соцсети)',        'Заполнить sameAs соцсетями и Wikidata'),
('SCHEMA_P2_REVIEW_AGG',     'SCHEMA', 'P2',  2, 'Нет AggregateRating, хотя есть отзывы',      'Добавить AggregateRating если есть отзывы')
ON CONFLICT (rule_code) DO NOTHING;

-- ----- AI/LLM axis (≥ 85 to pass) -----------------------------------------
INSERT INTO preflight_rules (rule_code, axis, severity, weight, description_ru, remediation_ru) VALUES
('AILLM_P0_LLMS_TXT',        'AI_LLM', 'P0', 10, 'Файл /llms.txt отсутствует',                 'Опубликовать llms.txt согласно spec llmstxt.org'),
('AILLM_P0_AI_ROBOTS',       'AI_LLM', 'P0',  8, 'В robots.txt нет правил для AI ботов',       'Прописать User-agent для GPTBot/ClaudeBot/Google-Extended/PerplexityBot'),
('AILLM_P0_INTRO_ANSWER',    'AI_LLM', 'P0',  8, 'Нет первого ответа 40-80 слов в начале',     'Добавить intro_answer для извлечения LLM-ответа'),
('AILLM_P0_FAQ_BLOCK',       'AI_LLM', 'P0',  8, 'Нет FAQ-блока ≥ 5 пар Q/A',                  'Добавить FAQPage с минимум 5 элементами'),
('AILLM_P1_WELL_KNOWN_AI',   'AI_LLM', 'P1',  4, 'Нет /.well-known/ai.txt',                    'Опубликовать ai.txt с политикой обучения и контактом'),
('AILLM_P1_CITABLE_FACTS',   'AI_LLM', 'P1',  4, 'Контент не структурирован для цитирования',  'Использовать списки, таблицы, выделенные факты'),
('AILLM_P1_AUTHOR_BIO',      'AI_LLM', 'P1',  3, 'Нет автора / профиля эксперта',              'Добавить блок автора с Person schema и ссылками'),
('AILLM_P1_LAST_UPDATED',    'AI_LLM', 'P1',  3, 'Нет даты последнего обновления',             'Указать dateModified и видимый "Обновлено: ..."'),
('AILLM_P2_OG_AI_HINT',      'AI_LLM', 'P2',  2, 'Нет meta name="ai-content-policy"',          'Добавить meta-тег с политикой AI'),
('AILLM_P2_GLOSSARY',        'AI_LLM', 'P2',  2, 'Нет глоссария / ключевых определений',       'Добавить блок DefinedTerm для ключевых терминов')
ON CONFLICT (rule_code) DO NOTHING;

COMMIT;
