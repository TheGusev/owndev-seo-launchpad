

## Итерация 3 + критический фикс backend

### Проблема backend (root cause)

`tsconfig.json` имеет `rootDir: "src"` и `outDir: "dist"`. После `npm run build` файл `configLoader.ts` оказывается в `dist/services/SiteFormula/configLoader.js`. В нём CONFIG_DIR резолвится как `../../../config` от расположения файла — это `owndev-backend/config/` от `src/`, но от `dist/services/SiteFormula/` это **корень проекта**, не `owndev-backend/config/`. Плюс `tsc` **не копирует** JSON файлы в `dist`. Результат: backend падает на старте/первом запросе.

Также в `siteFormulaRoutes` на строке 12 идёт `await sql\`CREATE TABLE...\`` **до регистрации route handlers** — если таблиц нет и БД недоступна на момент регистрации плагина, сервер падает.

### Фикс backend

**`owndev-backend/src/services/SiteFormula/configLoader.ts`** — исправить путь:
```ts
// Резолвим от корня проекта owndev-backend (за 2 уровня от src/dist + services + SiteFormula = 3)
// Правильно: от dist/services/SiteFormula → ../../../ = owndev-backend root
// Файл уже корректен по относительным путям, но JSON не копируется → добавить копирование
```

Точное решение: использовать `process.cwd()` + явный относительный путь, **не зависящий от dist/src**:
```ts
const CONFIG_DIR = resolve(process.cwd(), 'config');
```
Это работает и для `tsx watch` (dev) и для `node dist/index.js` (prod), так как `cwd` всегда `owndev-backend/`.

**`owndev-backend/package.json`** — добавить копирование config в build:
```json
"build": "tsc && cp -r config dist/config"
```
(на всякий случай, для будущей поддержки `__dirname`-based путей)

**`owndev-backend/src/api/routes/siteFormula.ts`** — обернуть `CREATE TABLE` в try/catch и вынести из плагина (или сделать non-blocking warning), чтобы регистрация плагина не валила сервер.

### Iteration 3: фронтенд

#### 1. Бесплатный unlock (на время теста)

В `src/components/site-formula/UnlockCTA.tsx` поменять текст: "Бесплатно в бета-версии" → крупно вынести "Beta — бесплатно", заменить иконку Lock на Sparkles. Backend уже разрешает unlock без оплаты (строка 184 `siteFormula.ts`: `// TODO: payment verification`), так что менять backend не нужно.

#### 2. Export PDF/Word для blueprint

Создать `src/lib/generateSiteFormulaPdf.ts` и `src/lib/generateSiteFormulaWord.ts`:
- Используют `jsPDF` + `Roboto` (как существующий `generatePdfReport.ts`)
- Принимают `FullReportPayload`
- Рендерят: заголовок, project_class бейдж, метаданные, все 17 sections с их title/content (текст + списки), decision_trace summary в конце
- Стиль: тот же `PRINT_COLORS` из `reportHelpers.ts` (тёмный отчёт OWNDEV)
- Word — через `docx` библиотеку (уже стоит в `bun.lock`? проверим — если нет, добавить через `npm install docx`)

Создать `src/components/site-formula/BlueprintExportButtons.tsx` — кнопки Export PDF / Export Word.

Подключить в `src/pages/SiteFormulaReport.tsx` — кнопка Download уже есть в импорте (строка 11), но не используется. Заменить на полноценные ExportButtons.

#### 3. Mobile-first адаптация

Аудит и правки в:
- `SiteFormula.tsx` — hero title clamp, layers grid `sm:grid-cols-2 lg:grid-cols-3` уже ок, проверить padding
- `SiteFormulaWizard.tsx` — увеличить touch targets (radio/checkbox), убедиться что navigation buttons stack на мобиле
- `SiteFormulaPreview.tsx` — PreviewCard и UnlockCTA компактнее на мобиле
- `SiteFormulaReport.tsx` — accordion sections без horizontal overflow, BlueprintSection content render с `prose-sm sm:prose-base`
- `WizardStepRenderer.tsx` — option cards full-width на мобиле, multi-column на ≥sm

#### 4. Loading skeletons

Создать `src/components/site-formula/SiteFormulaSkeletons.tsx` с 3 экспортами:
- `WizardSkeleton` — placeholder для шага: progress bar + 3 option cards
- `PreviewSkeleton` — карточка с заглушками для project class + scores + reasons
- `BlueprintSkeleton` — header + 5 collapsed accordion-секций

Заменить голые `<Loader2 spin>` в:
- `SiteFormulaWizard.tsx` (строка 78) → WizardSkeleton
- `SiteFormulaPreview.tsx` (строка 76) → PreviewSkeleton
- `SiteFormulaReport.tsx` → BlueprintSkeleton

#### 5. Error/empty states

В `SiteFormulaReport.tsx` уже есть базовый error state — улучшить: добавить иконку, кнопку "Пройти wizard заново".

### Команда деплоя (обновлённая)

```bash
cd /var/www/owndev.ru && \
git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && \
npm install && \
npm run build && \
psql "$DATABASE_URL" -f src/db/migrations/002_site_formula.sql && \
pm2 restart owndev-backend && \
cd /var/www/owndev.ru && \
npm install && \
npm run build && \
pm2 status
```

Добавлен `npm install` в backend (для новых зависимостей если будут) и проверка миграции.

### Создаваемые/изменяемые файлы

**Backend (фикс):**
- ✏️ `owndev-backend/src/services/SiteFormula/configLoader.ts`
- ✏️ `owndev-backend/package.json` (build script)
- ✏️ `owndev-backend/src/api/routes/siteFormula.ts` (защитить CREATE TABLE)

**Frontend (Iteration 3):**
- 🆕 `src/lib/generateSiteFormulaPdf.ts`
- 🆕 `src/lib/generateSiteFormulaWord.ts`
- 🆕 `src/components/site-formula/BlueprintExportButtons.tsx`
- 🆕 `src/components/site-formula/SiteFormulaSkeletons.tsx`
- ✏️ `src/components/site-formula/UnlockCTA.tsx` (бесплатный режим)
- ✏️ `src/pages/SiteFormulaReport.tsx` (export buttons + skeleton)
- ✏️ `src/pages/SiteFormulaPreview.tsx` (skeleton)
- ✏️ `src/pages/SiteFormulaWizard.tsx` (skeleton + mobile)
- ✏️ `src/pages/SiteFormula.tsx` (mobile полировка)
- ✏️ `src/components/site-formula/WizardStepRenderer.tsx` (mobile-first)
- ✏️ `src/components/site-formula/BlueprintSection.tsx` (mobile content)
- ✏️ `src/components/site-formula/PreviewCard.tsx` (mobile)

**Зависимости:** `docx` для Word-экспорта (если ещё нет).

### Что НЕ ломаем

- Header/Footer/мобильное меню — не трогаем
- Существующие routes (audit, monitor, siteCheck) — не трогаем
- DB миграция уже применена, изменений нет
- Логика engine (rules.v1.json, services/SiteFormula/*) — не меняем, только configLoader.ts путь
- Paywall открывается бесплатно через текущий unlock flow, **никаких новых endpoints не нужно**

### Self-check

- ✅ Бизнес-логика остаётся на backend, frontend только рендерит payload
- ✅ Export PDF/Word — это рендеринг payload в другой формат, не принятие решений
- ✅ Бесплатный unlock — это только UI текст, backend уже идемпотентен и не требует токена
- ✅ Mobile-first не меняет flow, только стили
- ✅ Skeletons — только UX улучшение
- ✅ Backend fix решает root cause (cwd-based path + защита от падения на CREATE TABLE)

