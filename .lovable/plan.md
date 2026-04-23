

## Локализация блока llms.txt через единый i18n-словарь

### Контекст

Сейчас в `src/pages/SiteCheckResult.tsx` (строки ~270–295) тексты блока `llms.txt` захардкожены на русском прямо в JSX:
- «llms.txt найден на сайте — проверка пройдена ✓»
- «Сгенерировать llms.txt для вашего сайта»
- «На вашем сайте файл не найден — создайте по стандарту llmstxt.org»

В проекте **нет** установленной i18n-библиотеки (`react-i18next`, `formatjs` и т.п.) — все тексты по проекту хранятся как строковые литералы в JSX. Соответственно «единый словарь» нужно завести как лёгкий собственный модуль без новых зависимостей, чтобы потом туда же постепенно переезжали и другие тексты.

### Что делаем

#### 1. Создать минимальный i18n-словарь

**Новый файл:** `src/i18n/strings.ts`

- Один объект `strings` с namespace-ами по разделам (`siteCheckResult.llmsTxt.*` для текущего блока).
- Помощник `t(path: string, vars?: Record<string,string>)` — лукап по точечному пути + простая подстановка `{var}`.
- Дефолтный язык — `ru` (другие пока не вводим, но структура готова к добавлению `en` без рефакторинга).

Структура:

```ts
// src/i18n/strings.ts
export const strings = {
  ru: {
    siteCheckResult: {
      llmsTxt: {
        foundBadge: 'llms.txt найден на сайте — проверка пройдена ✓',
        generateButton: 'Сгенерировать llms.txt для вашего сайта',
        notFoundHint: 'На вашем сайте файл не найден — создайте по стандарту llmstxt.org',
      },
    },
  },
} as const;

export type Lang = keyof typeof strings;          // 'ru'
const DEFAULT_LANG: Lang = 'ru';

export function t(path: string, vars?: Record<string, string>, lang: Lang = DEFAULT_LANG): string {
  const value = path.split('.').reduce<any>((acc, key) => (acc ? acc[key] : undefined), strings[lang]);
  if (typeof value !== 'string') return path; // fallback: показать путь, если ключ не найден
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`) : value;
}
```

Без хука/контекста — простая функция. Этого достаточно: язык один, ререндеры на смену языка пока не нужны.

#### 2. Подключить словарь в `SiteCheckResult.tsx`

В `src/pages/SiteCheckResult.tsx`:
- Добавить импорт: `import { t } from '@/i18n/strings';`
- Заменить три захардкоженные строки в блоке llms.txt (строки ~270–295) на:
  - `t('siteCheckResult.llmsTxt.foundBadge')`
  - `t('siteCheckResult.llmsTxt.generateButton')`
  - `t('siteCheckResult.llmsTxt.notFoundHint')`

Никакой другой логики/верстки не трогаем — состояния `hasLlms`, иконки `<Bot/>`, классы, импорт `generateLlmsTxt` остаются как есть.

### Технические детали

**Файлы:**
- `src/i18n/strings.ts` — новый, ~25 строк, без зависимостей.
- `src/pages/SiteCheckResult.tsx` — заменить 3 строковых литерала на вызовы `t(...)`, добавить 1 импорт.

**Обратная совместимость:** визуально и функционально для пользователя ничего не меняется — тот же текст, та же логика отображения. Меняется только источник строк.

**Расширение в будущем:**
- Добавление нового языка = новая ветка в `strings.ru` → `strings.en` + переключатель `lang` (можно завести через `localStorage`/контекст позже).
- Перевод новых блоков (например `ScanProgress` под‑шаги или `ReportValue`) — добавлять ключи в тот же словарь и заменять литералы на `t(...)`.

**Деплой:** только фронт, автодеплой через GitHub Actions после пуша в `main`.

