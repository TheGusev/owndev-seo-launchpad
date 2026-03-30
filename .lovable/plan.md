

## Доработка нормализации keywords/minusWords

Нормализация уже реализована в `SiteCheckResult.tsx` (строки 95-105) и CSV маппинг в `DownloadButtons.tsx` уже использует `kw.keyword`/`kw.volume`. Нужны точечные улучшения.

### 1. `src/pages/SiteCheckResult.tsx` (строки 95-105)

- `intent`: дефолт `"—"` вместо `''`
- `landing_needed`: дефолт `false`
- `cluster`: добавить fallback `kw.category`
- minus-words: strip `^-` из word, добавить дефолты `type: "general"`, `reason: ""`

### 2. `src/components/site-check/DownloadButtons.tsx`

- `buildKeywordsCsv`: добавить колонку "Нужен лендинг", дефолт `""` вместо `"—"`
- `buildMinusTxt`: упростить — данные уже нормализованы, просто `-${w.word.trim()}`

Два файла, точечные правки.

