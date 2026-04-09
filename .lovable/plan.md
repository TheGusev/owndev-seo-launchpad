

## Интеграция блока «Готовность к ЯндексGPT и Алисе» в GEO-аудит

### Backend: новый блок в AuditService

**Файл:** `owndev-backend/src/services/AuditService.ts`

Добавить 7-й блок `checkYandexAiReadiness(data)` с весом **10** (перераспределить: снизить AI Readiness и Content Structure с 20 до 18, итого 100%).

Проверки:

| Сигнал | Severity | Priority | Логика |
|--------|----------|----------|--------|
| llms.txt отсутствует | warning | P2 | `!d.llmsTxt.found` |
| llms.txt без описания разделов | info | P3 | `found && content.length < 200` |
| Нет Organization/WebSite schema | warning | P2 | Проверка `@type` в `d.schemas` |
| Нет Article/FAQPage/HowTo для контента | info | P3 | Проверка `@type` |
| Нет вопросительных H2/H3 | info | P3 | Regex `\?<\/(h[23])>` |
| Нет списков и таблиц | info | P3 | `<ul>/<ol>/<table>` |
| Скорость >5с | critical | P1 | `d.duration_ms > 5000` |
| Скорость 3–5с | warning | P2 | `d.duration_ms > 3000 && <= 5000` |

Все issues получают `category: "yandex_ai"`.

Блок возвращает `{ name: 'yandex_ai_readiness', weight: 10, score, issues }`.

В `analyze()` добавить вызов `this.safeBlock(() => this.checkYandexAiReadiness(data))` в массив blocks.

**Веса после изменения:** Indexability 15, Content 18, AI Readiness 18, Schema 15, E-E-A-T 15, Technical 15, Yandex AI 10 = **106** → нормализация через `totalWeight` уже работает корректно.

### Frontend: новая секция в AuditResultView

**Файл:** `src/components/audit/AuditResultView.tsx`

Добавить в массив `SECTIONS` новый элемент перед `brand`:

```typescript
{
  id: "yandex-ai",
  label: "ЯндексGPT и Алиса",
  categories: ["yandex_ai"],
  whyImportant: "ЯндексGPT и голосовой помощник Алиса используют структуру, скорость и разметку сайта для формирования ответов в поиске."
}
```

Это автоматически подхватится через `AuditSectionBlock` — если issues с `category: "yandex_ai"` отсутствуют, секция покажет зелёный статус «OK». Никаких дополнительных изменений UI не требуется — существующая архитектура справится.

### Файлы и объём изменений

| Файл | Действие | Строк |
|------|----------|-------|
| `owndev-backend/src/services/AuditService.ts` | Добавить `checkYandexAiReadiness()`, обновить веса | ~50 |
| `src/components/audit/AuditResultView.tsx` | Добавить 1 элемент в SECTIONS | ~5 |

### Что НЕ трогаем
- Типы `AuditBlock`, `AuditIssue` — уже поддерживают новый блок
- Остальные блоки проверок — без изменений (только веса Content и AI Readiness: 20→18)
- Компоненты `AuditSectionBlock`, `AuditIssueRow` — работают as-is
- База данных — без миграций

