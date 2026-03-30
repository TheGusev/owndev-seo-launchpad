

## Исправление ошибки "Cannot read properties of undefined (reading 'total')"

### Причина

Поле `scores` в таблице `scans` имеет тип `Json | null`. Данные приходят, но `scores` может быть `null` или иметь неожиданную структуру. Хотя в `SiteCheckResult.tsx` есть проверка `data.scores &&` перед `ScoreCards`, проблема в том, что `data.scores` может быть truthy (например, пустой объект `{}`), но не содержать `total`. Также `CompetitorsTable` получает `userScores={data.scores}` без проверки на наличие полей, а внутри конкуренты обращаются к `c.scores.total` без optional chaining.

### План (4 файла)

#### 1. `src/pages/SiteCheckResult.tsx`

Добавить нормализацию scores перед передачей в компоненты:

```typescript
const defaultScores = { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 };
const scores = data.scores 
  ? { ...defaultScores, ...(data.scores as any) } 
  : null;
```

Использовать `scores` вместо `data.scores` в JSX:
- `{scores && <ScoreCards scores={scores} ... />}`
- `userScores={scores}` в CompetitorsTable

#### 2. `src/components/site-check/ScoreCards.tsx`

Добавить defensive defaults в компонент:
- `const safeScore = scores?.[key] ?? 0` перед использованием в `CircleScore` и `getScoreColor`

#### 3. `src/components/site-check/CompetitorsTable.tsx`

Добавить optional chaining для `c.scores`:
- `c.scores?.total ?? 0` во всех обращениях
- `userScores?.total ?? 0` во всех обращениях

#### 4. `src/components/site-check/FullReportView.tsx`

Проверить что `issues` передаётся как массив — уже защищено в SiteCheckResult, но добавить `if (!issues?.length) return null` внутри компонента.

### Файлы

| Файл | Изменение |
|------|-----------|
| `SiteCheckResult.tsx` | Нормализация scores с defaultScores |
| `ScoreCards.tsx` | `scores[key] ?? 0` |
| `CompetitorsTable.tsx` | Optional chaining на все scores |
| `FullReportView.tsx` | Guard на пустой issues |

