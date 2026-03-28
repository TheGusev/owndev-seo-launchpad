

## БЛОК 5 — История сканов

### 1. Новый файл `src/utils/scanHistory.ts`

Утилита с интерфейсом `ScanHistoryItem` и функциями `addToHistory`, `getHistory`, `clearHistory`. Хранит до 10 записей в localStorage под ключом `owndev_scan_history`.

### 2. `src/pages/SiteCheckResult.tsx`

После успешной загрузки данных (в `.then(setData)`) вызвать `addToHistory({ scanId, url: data.url, date: new Date().toISOString(), scores: data.scores })`.

Заменить ссылку "Новая проверка" на breadcrumb-навигацию:
```
← Новая проверка  |  История проверок
```
Обе ссылки ведут на `/tools/site-check`, вторая с якорем `#history`.

### 3. `src/pages/SiteCheck.tsx`

Под формой (после блока `limitScanId`) добавить секцию "Последние проверки":
- Показывается только если `getHistory().length > 0`
- Максимум 5 записей: иконка Globe + URL + дата (форматированная) + кнопка "Открыть"
- Кнопка "Очистить историю" серым текстом внизу
- При очистке — обновить state, блок скрывается

### Файлы

| Файл | Действие |
|------|----------|
| `src/utils/scanHistory.ts` | Новый |
| `src/pages/SiteCheckResult.tsx` | addToHistory + breadcrumb |
| `src/pages/SiteCheck.tsx` | Блок истории |

