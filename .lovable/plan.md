

## Единый компонент AuditResultView

### Проблема

Каждый инструмент рендерит результаты по-своему: SEOAuditor — скоры + issues, IndexationChecker — статусы ссылок, BrandTracker — таблица упоминаний. При этом данные сильно различаются по структуре. Универсальный компонент должен работать с общим форматом `AuditResult`, но не ломать специфичные инструменты.

### Подход

Создать `AuditResultView` как модульный компонент с опциональными секциями. Каждая секция рендерится только если в `meta` или `issues` есть соответствующие данные. Компонент применяется в SEOAuditor (полный формат) и может постепенно внедряться в другие инструменты по мере унификации их backend-ответов. Инструменты с нестандартными данными (BrandTracker, InternalLinks) пока сохраняют свой рендеринг.

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/audit/AuditResultView.tsx` | Новый — главный компонент |
| `src/components/audit/AuditSectionBlock.tsx` | Новый — блок секции (Indexability, Content, AI Readiness и т.д.) |
| `src/components/audit/AuditIssueRow.tsx` | Новый — строка issue с priority, confidence, source |
| `src/components/audit/AuditPriorityList.tsx` | Новый — блок P1/P2/P3 приоритетов внизу |
| `src/components/audit/AuditActions.tsx` | Новый — кнопки «Сохранить», «Экспорт PDF», «Поделиться» |
| `src/components/audit/index.ts` | Новый — barrel export |
| `src/components/tools/SEOAuditor.tsx` | Рефакторинг — заменить результатный блок на `<AuditResultView>` |

### Структура AuditResultView

```text
┌─────────────────────────────────────────┐
│ Сводка: summary + score + confidence    │
│ [3 критических P1] [3 быстрых улучш.]  │
├─────────────────────────────────────────┤
│ ▸ Indexability         OK / Warning     │
│ ▸ Content Structure    Critical         │
│ ▸ AI Readiness         Warning          │
│ ▸ E-E-A-T              OK              │
│ ▸ Schema / llms.txt    Critical         │
│ ▸ Speed / Rendering    OK              │
│ ▸ Brand Signals        — в разработке  │
├─────────────────────────────────────────┤
│ Приоритеты: P1 → P2 → P3              │
├─────────────────────────────────────────┤
│ [Сохранить] [Экспорт PDF] [Поделиться] │
└─────────────────────────────────────────┘
```

### Пропсы AuditResultView

```typescript
interface AuditResultViewProps {
  result: AuditResult | null;
  isLoading?: boolean;
  error?: string | null;
  toolId?: ToolId;
  url?: string;
  onRetry?: () => void;
}
```

### Маппинг данных

**Секции** определяются через конфиг-массив:
```typescript
const SECTIONS = [
  { id: 'indexability', label: 'Indexability', categories: ['technical'] },
  { id: 'content', label: 'Content Structure', categories: ['content'] },
  { id: 'ai-readiness', label: 'AI Readiness', categories: ['ai'] },
  { id: 'eeat', label: 'E-E-A-T', categories: ['eeat'] },
  { id: 'schema', label: 'Schema / llms.txt', categories: ['schema'] },
  { id: 'speed', label: 'Speed / Rendering', categories: ['speed', 'performance'] },
  { id: 'brand', label: 'Brand Signals', categories: ['brand'] },
];
```

Issues группируются по `category` → секция. Если в секции 0 issues, показывается «OK» или «Недостаточно данных» (в зависимости от наличия данных в `meta`).

**P1/P2/P3**: issues сортируются по `priority`, выводятся в 3 группы: «Сделать сейчас», «В ближайший спринт», «По мере возможности». Issues без priority трактуются как P3.

**Confidence**: берётся из `issue.meta?.confidence` или из общего `result.confidence`. Отображается как бейдж `XX%` рядом с issue.

**Source**: `issue.meta?.source` (html / headers / dom / heuristic / external) — мелкий бейдж.

### AuditSectionBlock

Каждый блок:
- Заголовок + статус-бейдж (OK зелёный / Warning жёлтый / Critical красный)
- Аккордеон: раскрывается при клике
- Внутри: пояснение «Почему важно» + список AuditIssueRow
- Если нет данных: «Недостаточно данных для анализа»
- Brand Signals: всегда «В разработке»

### AuditIssueRow

Компактная строка:
- Иконка severity (цветной кружок)
- Title + description
- Priority бейдж (P1 красный, P2 жёлтый, P3 серый)
- Confidence `XX%`
- Source бейдж
- Раскрывается → recommendation + action text

### Кнопки (AuditActions)

- «Сохранить результат» — заглушка с toast «Функция в разработке»
- «Экспорт в PDF» — вызов существующего `generatePdfReport` если есть, иначе заглушка
- «Поделиться» — заглушка с toast

### Интеграция в SEOAuditor

Заменить блок `{result && (<>...</>)}` (строки 189-313) на:
```tsx
<AuditResultView
  result={normalizedResult}
  isLoading={loading}
  error={error}
  toolId="seo-audit"
  url={url}
  onRetry={runAudit}
/>
```

Нормализация: маппинг из локального `AuditResult` (seoScore/llmScore/issues с category seo/llm) → общий `AuditResult` (score, confidence, issues с priority/category).

### Что НЕ трогаем

- Header, Footer, роутинг — 0 изменений
- BrandTracker, InternalLinksChecker, CompetitorAnalysis — сохраняют свой рендеринг (данные не в формате AuditResult)
- IndexationChecker — пока сохраняет свой рендеринг (можно перевести позже)
- Стилистика: тёмная тема, glass-эффекты, существующая палитра

### Объём

~250 строк AuditResultView + ~60 строк подкомпоненты + ~30 строк рефакторинг SEOAuditor. Итого ~340 строк нового кода.

