

## 📋 План: Удаление трёх секций с главной страницы

### Удаляемые секции:
1. **Process** — "Процесс за 4 шага"
2. **ROICalculator** — "Рассчитайте свой ROI"
3. **Results** — "Что достигли наши клиенты"

### Изменения в `src/pages/Index.tsx`:

#### 1. Удалить импорты (строки 4, 8, 9):
```tsx
// Удалить:
import Process from "@/components/Process";
import ROICalculator from "@/components/ROICalculator";
import Results from "@/components/Results";
```

#### 2. Удалить компоненты из JSX (строки 27, 31, 32):
```tsx
// Удалить:
<Process />
<ROICalculator />
<Results />
```

### Итоговая структура страницы:

| До | После |
|----|-------|
| Hero | Hero |
| ProblemsAndSolutions | ProblemsAndSolutions |
| ~~Process~~ | — |
| Capabilities | Capabilities |
| Portfolio | Portfolio |
| Pricing | Pricing |
| ~~ROICalculator~~ | — |
| ~~Results~~ | — |
| FAQ | FAQ |
| ContactForm | ContactForm |

### Примечание:
Файлы компонентов (`Process.tsx`, `ROICalculator.tsx`, `Results.tsx`) останутся в проекте, но не будут использоваться. При желании их можно удалить позже.

