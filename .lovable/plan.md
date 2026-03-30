

## Активация кнопок экспорта

### 3 файла, 3 правки

#### 1. `src/components/site-check/DownloadButtons.tsx` — полная переработка

Переписать компонент: принимает props `{ url, theme, scores, issues, keywords, minusWords, competitors }`. 4 активные кнопки:

- **Ключевые слова** → CSV через Blob (UTF-8 BOM, колонки: Кластер/Интент/Запрос/Частота). Disabled если `keywords` пуст.
- **Минус-слова** → TXT, по строке с префиксом `-`. Disabled если `minusWords` пуст.
- **PDF** → `window.print()`, стили через `@media print`.
- **Word** → текстовый отчёт (.txt) с URL, баллами, списком ошибок.

Хелпер `downloadBlob(content, filename, mime)` для генерации и скачивания.

#### 2. `src/pages/SiteCheckResult.tsx` — строка 128

Заменить `<DownloadButtons />` на:
```tsx
<DownloadButtons
  url={data.url}
  theme={data.theme}
  scores={scores}
  issues={issues}
  keywords={keywords}
  minusWords={minusWords}
  competitors={competitors}
/>
```

#### 3. `src/index.css` — добавить в конец файла

`@media print` блок: скрыть header/footer/nav/`.no-print`, белый фон, чёрный текст, убрать backdrop-filter у glass-элементов, читаемые цвета для бейджей, `page-break-inside: avoid` для секций.

