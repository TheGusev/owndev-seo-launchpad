

## План: полный аудит и приведение OWNDEV в работоспособное состояние

### Найденные проблемы (root causes)

**1. Site Formula падает у пользователя**
- `resumeSession()` восстанавливает любую сессию из localStorage, включая со `status='error'`. В `default` ставит `phase='wizard'`, но `useEffect` в Wizard видит непустой `sessionId` и НЕ создаёт новую → пользователь навечно застрял.
- Нет фильтрации `status === 'error'` в resume.

**2. Geo Rating: цифры "100/90/87" не меняются**
- React Query кэширует ключ `['geo-rating']` без `staleTime`. После нового скана invalidation нет.
- Но главное: если скан запущен из самой страницы Geo Rating (через `Link to /tools/site-check`), пользователь возвращается, а query не перефетчится без явной инвалидации.
- Нужен refetch при window focus + явная кнопка "Обновить".

**3. Direct Readiness "8/10" без объяснения + дублирование "Готового заголовка"**
- Backend в `directAudit()` считает 6 критериев и `readiness_score`, но не возвращает их breakdown. На фронт уходит только число.
- `DirectMeta` показывает блок "Готовый заголовок объявления" (`ad_headline`), а `DirectAdPreview` ниже — полное объявление. Дубль.
- В `scores.breakdown` нет `direct` и `schema` — модал "Как рассчитан?" пустой для 2 модулей.

**4. Tech Passport узкий**
- Завёрнут в `ResultAccordion` (max-w-4xl с padding). Раньше выходил шире.

**5. Edge Functions "намудрил"**
- Все 18 edge-функций деплоятся ок, секреты (`LOVABLE_API_KEY`, `EDGE_FUNCTION_SECRET`) на месте.
- Логов 0 — значит фронт тупо их не вызывает. Tools работают через `supabase.functions.invoke()`. Если на проде выходит ошибка CORS/network — увидим в Network.
- Корневая проблема: tools (SEOAuditor, IndexationChecker, etc.) на странице `/tools/<slug>` редко открываются, но если открываются — должны работать. Проверим ошибки CORS / 401 после деплоя.

**6. Полный расчёт (Score breakdown) недоступен на 2 страницах**
- В `SiteCheckPipeline.calcScoresWeighted()` `breakdown.direct` и `breakdown.schema` НЕ заполняются. Только `seo` и `ai`.

---

### Что делаем (поэтапно)

#### A. Backend — добавить недостающие данные

**`owndev-backend/src/services/SiteCheckPipeline.ts`:**

1. В `calcScoresWeighted()` сгенерировать breakdown по `direct` (6 критериев) и `schema` (5 критериев), используя те же regex маппинги issues→criteria. Веса берём из `DIRECT_CRITERIA` и `SCHEMA_CRITERIA` (фронт уже определил их в `scoreCalculation.ts`):
   - `h1Specificity, h1TitleMatch, textCoherence, noMixedTopics, commercialSignals, adHeadlineReady` для direct
   - `hasJsonLd, orgSchema, breadcrumb, faqSchema, productOrService` для schema
2. `directAudit()` уже считает 6 чеков → возвращать массив `{key, label, status, weight, earned}` в `direct_breakdown`.
3. Добавить в финальный `scores.breakdown`: `{ seo, ai, direct, schema }`.
4. Дополнительно сложить `direct_checks` в `seo_data.direct_checks` чтобы фронт мог показать каждый критерий с reason.

**`owndev-backend/src/api/routes/siteCheck.ts`:**
- `/result/:scanId` уже отдаёт `scores.breakdown` — менять не надо.

#### B. Frontend — Site Formula resume fix

**`src/hooks/useSiteFormulaSession.ts`:**
- В `resumeSession` если `session.status === 'error'` → удалить из localStorage, вернуть `false` (как будто сессии нет). 
- Wizard тогда автоматически создаст новую через `startSession()`.

#### C. Frontend — Geo Audit полировка

**`src/components/site-check/DirectMeta.tsx`:**
- Убрать блок "Готовый заголовок объявления" (он теперь только в `DirectAdPreview`).
- Оставить `autotargeting_categories` + добавить превью categories в виде badge.

**`src/components/site-check/DirectAdPreview.tsx`:**
- Под Readiness Score добавить секцию "Что проверено" — список 6 критериев (из `scores.breakdown.direct`) с ✓/✗ и reason.
- Если backend ещё не отдал breakdown (старые сканы) — показать generic объяснение по score.

**`src/pages/SiteCheckResult.tsx`:**
- Tech Passport вывести из `ResultAccordion` или сделать full-width внутри. Передать прямо `breakdown.direct`/`schema` в `ScoreCards`.

#### D. Geo Rating — refetch при возврате

**`src/pages/GeoRating.tsx`:**
- В `useQuery` добавить `refetchOnWindowFocus: true`, `staleTime: 30_000`.
- Добавить кнопку "Обновить" (`refetch()`).

#### E. Edge Functions — проверка после деплоя

- После деплоя открыть `/tools/seo-auditor`, прогнать домен, проверить Network что invoke `seo-audit` возвращает 200, в логах edge `seo-audit` появятся записи.
- Аналогично для `check-indexation`, `generate-text` и т.д.
- Если ошибки CORS — у всех функций уже `Access-Control-Allow-Headers` включает все нужные. Должно работать.

#### F. Команда деплоя

```bash
cd /var/www/owndev.ru && git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && npm install && npm run build && \
pm2 restart owndev-backend && \
cd /var/www/owndev.ru && npm install && npm run build && \
pm2 status && pm2 logs owndev-backend --lines 20 --nostream
```

Edge Functions деплоятся автоматически при push (через GitHub Action / Lovable Cloud), отдельной команды не нужно.

---

### Изменяемые файлы

**Backend:**
- ✏️ `owndev-backend/src/services/SiteCheckPipeline.ts` — добавить breakdown для direct/schema, вернуть `direct_checks`

**Frontend:**
- ✏️ `src/hooks/useSiteFormulaSession.ts` — фикс resume для error-сессий
- ✏️ `src/components/site-check/DirectMeta.tsx` — убрать дубль ad_headline
- ✏️ `src/components/site-check/DirectAdPreview.tsx` — детализация checks под Readiness Score
- ✏️ `src/pages/SiteCheckResult.tsx` — Tech Passport full-width
- ✏️ `src/pages/GeoRating.tsx` — refetch on focus + кнопка обновить

### Что НЕ ломаем

- Header/Footer/мобильное меню
- Edge Functions (только проверим работу после деплоя — код менять не нужно)
- Site Check pipeline rules — только добавляем breakdown
- DB схему — без миграций
- Engine Site Formula (rules.v1.json, services/SiteFormula/*) — без изменений
- Существующие сканы в БД — работают как есть

### Self-check

- ✅ Каждая жалоба пользователя адресована конкретным фиксом
- ✅ Изменения минимальные и точечные
- ✅ Backend менять только в одном файле (SiteCheckPipeline.ts) — добавляем поля, не ломаем существующие
- ✅ Frontend меняем 5 файлов, все изменения изолированы
- ✅ После деплоя пользователь увидит:
  - Site Formula больше не падает (новая сессия при error)
  - Geo Rating обновляется при возврате на страницу
  - Direct Readiness — полная разбивка 6 критериев
  - Score модалы Direct и Schema — детальная таблица
  - Tech Passport — широкий
  - Tools работают через edge functions (если были вообще сломаны — проверим)

