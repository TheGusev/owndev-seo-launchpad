

## Уникальные иконки для списка «Что проверяем»

### Изменения в `src/pages/SiteCheck.tsx`

Заменить массив строк на массив объектов `{ icon, text }` с уникальной Lucide-иконкой для каждого пункта:

| Пункт | Иконка |
|-------|--------|
| SEO Score (20+ параметров) | `Search` |
| LLM Score (AI-готовность) | `BrainCircuit` |
| Direct Readiness Score | `Target` |
| AI-генерация объявления Директа | `Sparkles` |
| Топ-10 конкурентов | `Users` |
| 200+ ключевых слов | `Key` |
| Минус-слова для Директа | `Ban` |
| E-E-A-T и Schema.org | `ShieldCheck` |
| llms.txt проверка и генерация | `FileText` |
| Экспорт PDF / Word / CSV | `Download` |

- Каждая иконка рендерится вместо `Check` с классом `w-4 h-4 text-primary shrink-0` (фирменный акцентный цвет вместо зелёного).
- Импорт `Check` убирается из lucide-react, добавляются 10 новых иконок.

