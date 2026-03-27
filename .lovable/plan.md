

## ПРОМТ 8 — Интеграция чек-листа блога в движок правил

### Текущее состояние

- Таблица `scan_rules` уже существует в БД с полями: `id`, `module`, `severity`, `title`, `description`, `how_to_check`, `fix_template`, `score_weight`, `visible_in_preview`, `active`. Не хватает полей `source`, `example_fix`, `rule_id` (string-идентификатор).
- Движок (`site-check-scan`) использует **хардкод** проверок — не загружает правила из БД.
- Скоринг считается простым вычитанием по severity, а не по `score_weight` из правил.
- Нет admin-панели.

### План реализации

#### 1. Миграция БД — расширить `scan_rules`

Добавить недостающие колонки:
- `source text DEFAULT 'technical'` — откуда правило (blog_checklist, direct_rules, technical, ai_rules)
- `example_fix text` — пример правильного варианта
- `rule_id text UNIQUE` — человекочитаемый идентификатор (например `tech_robots_blocked`)
- `trigger_count integer DEFAULT 0` — счётчик срабатываний для статистики
- `last_triggered_at timestamptz` — для фильтра "за 7 дней"

Индексы: `(module, active)`, `(source)`.

#### 2. Импорт ~35 правил в `scan_rules`

Заполнить таблицу правилами по 5 группам из промта:

| Группа | Кол-во правил | Примеры |
|--------|--------------|---------|
| technical | 9 | HTTP 200, SSL, robots.txt, sitemap, canonical, noindex, LCP, viewport, битые ссылки |
| content | 7 | Title длина/ключ, Description длина/CTA, H1 единственный/ключ, H2 структура, объём текста, уникальность H1≠Title, переспам |
| direct | 5 | H1 конкретность, H1↔Title совпадение, когерентность, ≤2 тематик, коммерческие сигналы |
| schema | 4 | JSON-LD наличие, тип разметки, валидация, OpenGraph |
| ai | 4 | Структура без контекста, определения, FAQ-блок, H2 как вопросы |

Каждое правило с `how_to_check` (инструкция для движка), `fix_template`, `example_fix`, `score_weight` (нормализованный).

#### 3. Обновить edge function `site-check-scan` — использовать правила из БД

Текущие хардкод-проверки остаются как fallback. Новая логика:
1. В начале scan: `SELECT * FROM scan_rules WHERE active = true`
2. Группировка по `module`
3. Для каждого правила — выполнить проверку (how_to_check содержит ключ-паттерн типа `check_robots_blocked`, `check_title_length` и т.д.)
4. При нарушении — создать IssueCard из `fix_template` + `example_fix`
5. Инкрементировать `trigger_count` для сработавших правил
6. Скоринг: `score = (Σ weight_passed / Σ weight_all) * 100` вместо текущего вычитания

#### 4. Admin-панель `/admin/rules`

Защита: простой пароль через `localStorage` (без auth системы — это внутренний инструмент).

Функциональность:
- Таблица всех правил с фильтрами по module, severity, source
- Inline-редактирование полей
- Toggle active/inactive
- Форма добавления нового правила
- Колонка "Срабатываний за 7 дней" (из `trigger_count` / `last_triggered_at`)

### Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | ALTER TABLE scan_rules + INSERT ~35 правил |
| `supabase/functions/site-check-scan/index.ts` | Загрузка правил из БД, rules-based scoring |
| `src/pages/AdminRules.tsx` | Новый — admin-панель |
| `src/App.tsx` | Добавить роут `/admin/rules` |

