

## Баг: DirectAdPreview крашит страницу при отсутствии sitelinks/callouts

### A. Root cause

`DirectAdPreview` на строках 39-40 делает:
```tsx
const [sitelinks, setSitelinks] = useState([...adSuggestion.sitelinks]);
const [callouts, setCallouts] = useState([...adSuggestion.callouts]);
```

Если API вернул `ad_suggestion` без `sitelinks` или `callouts` (т.е. они `undefined`/`null`), spread `[...undefined]` бросает `TypeError: undefined is not iterable` — React крашит весь компонент и всю страницу.

Та же проблема в `startEdit()` (строки 54-55) и в `currentAd` (строки 46-47), где обращаемся к `adSuggestion.sitelinks` / `adSuggestion.callouts` без fallback.

### B. Почему раньше работало

Когда Директ-блок только добавили, API всегда возвращал полный объект. После изменений в backend pipeline некоторые результаты стали возвращать `ad_suggestion` с `headline1`/`headline2`/`ad_text`, но без `sitelinks`/`callouts`.

### C. Fix — 1 файл, 6 точек

**`src/components/site-check/DirectAdPreview.tsx`** — добавить `?? []` fallback в 6 местах:

1. **Строка 39**: `useState([...(adSuggestion.sitelinks ?? [])])`
2. **Строка 40**: `useState([...(adSuggestion.callouts ?? [])])`
3. **Строка 46**: `sitelinks: isEditing ? sitelinks : (adSuggestion.sitelinks ?? [])`
4. **Строка 47**: `callouts: isEditing ? callouts : (adSuggestion.callouts ?? [])`
5. **Строка 54**: `setSitelinks([...(adSuggestion.sitelinks ?? [])])`
6. **Строка 55**: `setCallouts([...(adSuggestion.callouts ?? [])])`

Больше ничего не меняем. Компонент станет null-safe и не будет крашить страницу.

### D. Затронутые файлы
1. `src/components/site-check/DirectAdPreview.tsx` — 6 точечных `?? []` fallback

