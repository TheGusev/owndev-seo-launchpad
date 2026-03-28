

## БЛОК 3 — Реструктуризация UI и продуктовый сценарий

### FIX 5: Переработка /tools — три визуальных раздела

**`src/pages/Tools.tsx`** — полная переработка контентной части:

**Раздел 1 — "Полная проверка сайта"** (hero-карточка на всю ширину):
- Site Check с бейджем "Флагманский продукт"
- Описание: "Технический SEO, индексация, конкуренты, ключевые запросы — один отчёт"
- Крупная teal-кнопка "Начать проверку →" → `/tools/site-check`
- Стилизация: glass-карточка с увеличенным padding, border-primary

**Раздел 2 — "Технические инструменты"** (сетка 3 колонки):
- Явный список slug'ов: `seo-auditor`, `indexation-checker`, `internal-links`, `competitor-analysis`, `semantic-core`, `schema-generator`
- Текущий стиль карточек сохраняется

**Раздел 3 — "Вспомогательные утилиты"** (сетка 4 колонки, collapsible):
- Slug'и: `pseo-generator`, `ai-text-generator`, `webmaster-files`, `anti-duplicate`, `position-monitor`, `llm-prompt-helper`
- По умолчанию свёрнут — показывается заголовок "Вспомогательные утилиты (6)" + кнопка "Показать все"
- Используем `useState` для toggle, без Radix Collapsible (проще)

Убираем старую логику `categories.map` — вместо неё три hardcoded раздела.

### FIX 6: Hero — двойная CTA + быстрый ввод URL

**`src/components/Hero.tsx`:**

1. Заменить одну кнопку "Инструменты" на две:
   - Главная (GradientButton, teal): "Проверить сайт бесплатно" → `/tools/site-check`
   - Вторичная (outline Button): "Все инструменты" → `/tools`

2. Под кнопками — поле быстрого ввода URL:
   ```
   [https://yoursite.ru          ] [Проверить →]
   ```
   - `useState` для url, `useNavigate` для redirect
   - При submit → `navigate(/tools/site-check?url=${encodeURIComponent(url)})`
   - Также вызвать `saveLastUrl(url)` из utils

### FIX 7: DownloadButtons — toast вместо тишины

**`src/components/site-check/DownloadButtons.tsx`:**
- Убрать `disabled={!paid}` — кнопки всегда кликабельны
- Добавить `className="opacity-50 cursor-not-allowed"` визуально
- `onClick` всегда показывает toast: "Генерация PDF-отчётов в разработке. Скоро будет доступно!"
- Под кнопками серый текст: "Генерация файлов появится после подключения оплаты"
- Убрать старый блок `{!paid && ...}`

### Файлы

| Файл | Действие |
|------|----------|
| `src/pages/Tools.tsx` | 3 раздела вместо категорий, collapsible утилиты |
| `src/components/Hero.tsx` | Двойная CTA + поле ввода URL |
| `src/components/site-check/DownloadButtons.tsx` | Toast + визуальный disabled |

