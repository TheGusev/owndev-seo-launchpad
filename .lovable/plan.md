

## 📋 План: Удаление секции "Прозрачная ценовая модель"

### Удаляемая секция:
- **Pricing** — "Прозрачная ценовая модель"

### Изменения в `src/pages/Index.tsx`:

#### 1. Удалить импорт (строка 6):
```tsx
// Удалить:
import Pricing from "@/components/Pricing";
```

#### 2. Удалить компонент из JSX (строка 26):
```tsx
// Удалить:
<Pricing />
```

### Итоговая структура страницы:

| До | После |
|----|-------|
| Hero | Hero |
| ProblemsAndSolutions | ProblemsAndSolutions |
| Capabilities | Capabilities |
| Portfolio | Portfolio |
| ~~Pricing~~ | — |
| FAQ | FAQ |
| ContactForm | ContactForm |

### Примечание:
Файл `Pricing.tsx` останется в проекте, но не будет использоваться.

