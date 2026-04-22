

## Цель

Заменить две фейковые проверки в `directAudit` (`SiteCheckPipeline.ts`) на настоящие, соответствующие их именам. Метки и issue-сообщения тоже привести в соответствие.

## Файл

`owndev-backend/src/services/SiteCheckPipeline.ts` — единственный затронутый файл.

## Правки

### 1. `DIRECT_CHECKS_META` (строки 695–702)

Заменить два неверных label:

```ts
{ key: 'noMixedTopics', label: 'Тематическая однородность', weight: 15 },
{ key: 'adHeadlineReady', label: 'H1 готов для Директа', weight: 15 },
```

Остальные 4 строки не трогаем.

### 2. Блок «5. Яндекс.Метрика» (строки 759–766) → реальная проверка `noMixedTopics`

Заменить целиком на:

```ts
// 5. Тематическая однородность H2/H3 относительно Title → noMixedTopics
const STOP_WORDS = new Set(['и','в','на','с','по','для','из','от','к','а','но','о','у','же','ли','бы','то','как','что','это']);
const headingMatches = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)]
  .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
  .filter(Boolean);

if (headingMatches.length < 2) {
  addCheck('noMixedTopics', 'pass', `На странице ${headingMatches.length} заголовков H2/H3 — проверка тематической однородности не требуется`);
} else {
  const titleWords = (title || '')
    .toLowerCase()
    .split(/[\s,—–\-|:.!?()]+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const threshold = Math.ceil(headingMatches.length * 0.5);
  let bestWord = '';
  let bestHits = 0;
  for (const w of titleWords) {
    const hits = headingMatches.filter(h => h.includes(w)).length;
    if (hits > bestHits) { bestHits = hits; bestWord = w; }
  }
  const homogeneous = bestHits >= threshold;
  if (!homogeneous) {
    issues.push(makeIssue({
      module: 'direct', severity: 'medium',
      title: 'Смешанные темы на странице',
      found: `Ни одно слово из Title не встречается в ≥50% заголовков H2/H3 (${bestHits}/${headingMatches.length})`,
      location: 'Заголовки H2/H3',
      why_it_matters: 'Автотаргетинг Директа хуже работает на страницах со смешанной тематикой — снижается релевантность',
      how_to_fix: 'Сделайте заголовки H2/H3 тематически связанными с Title страницы',
      example_fix: `Если Title — "${title.slice(0, 40)}", то H2/H3 должны раскрывать ту же тему`,
      visible_in_preview: true,
    }));
    addCheck('noMixedTopics', 'fail', `Тема Title не прослеживается в заголовках (лучшее совпадение: "${bestWord}" ${bestHits}/${headingMatches.length}, нужно ${threshold})`);
  } else {
    addCheck('noMixedTopics', 'pass', `Слово "${bestWord}" из Title встречается в ${bestHits}/${headingMatches.length} заголовках — тема однородна`);
  }
}
```

### 3. Блок «6. Viewport» (строки 768–775) → реальная проверка `adHeadlineReady`

Заменить целиком на:

```ts
// 6. Готовность H1 как рекламного заголовка Директа → adHeadlineReady
const h1Trim = h1.trim();
let adReady = false;
let adFailReason = '';
if (!h1Trim) {
  adFailReason = 'H1 отсутствует на странице';
} else if (h1Trim.length < 5 || h1Trim.length > 56) {
  adFailReason = `Длина H1 ${h1Trim.length} символов — вне допустимого диапазона 5–56 для рекламного заголовка Директа`;
} else if (/^[\d\W_]/.test(h1Trim)) {
  adFailReason = `H1 начинается с "${h1Trim[0]}" — рекламный заголовок должен начинаться с буквы`;
} else {
  const hasNoun = h1Trim
    .split(/[\s,—–\-|:.!?()]+/)
    .some(w => w.replace(/[^\p{L}]/gu, '').length > 4);
  if (!hasNoun) {
    adFailReason = 'H1 не содержит ни одного слова длиннее 4 букв — нет смыслового якоря для рекламного заголовка';
  } else {
    adReady = true;
  }
}

if (!adReady) {
  issues.push(makeIssue({
    module: 'direct', severity: 'high',
    title: 'H1 не готов для рекламного заголовка Директа',
    found: h1Trim ? `H1: "${h1Trim}" (${h1Trim.length} симв.)` : 'H1 отсутствует',
    location: '<h1>',
    why_it_matters: 'Директ часто использует H1 как заголовок объявления. Если H1 длинный, начинается с цифры или слишком общий — заголовок будет обрезан или непривлекательным',
    how_to_fix: 'Перепишите H1: длина 5–56 символов, начало с буквы, минимум одно содержательное слово (>4 букв)',
    example_fix: `<h1>${theme || 'Услуги под ключ'} в Москве</h1>`,
    visible_in_preview: true,
  }));
  addCheck('adHeadlineReady', 'fail', adFailReason);
} else {
  addCheck('adHeadlineReady', 'pass', `H1 "${h1Trim}" подходит для рекламного заголовка Директа (${h1Trim.length} симв.)`);
}
```

### 4. TypeScript

После правок — `cd owndev-backend && npx tsc --noEmit`. Все типы существующие, без `any`-наркомании, должны компилиться чисто.

## Что НЕ трогаем

- Проверки 1–4 (`h1TitleMatch`, `h1Specificity`, `textCoherence`, `commercialSignals`) — без изменений.
- Веса в `DIRECT_WEIGHTS` (строки 213–216) — не меняются.
- `ad_headline`/`autotargeting_categories`/`readiness_score` (строки 777+) — без изменений.
- Любые другие функции в файле, фронтенд, БД, правила памяти.

## Побочный эффект (важно знать)

- Из `issues` исчезнут текущие записи «Нет Яндекс.Метрики» (critical) и «viewport не найден» (high), а вместо них могут появляться «Смешанные темы» (medium) и «H1 не готов для Директа» (high). Если позже потребуется отдельно проверять Метрику/viewport — сделаем под собственными ключами в новых задачах. Сейчас приоритет — устранить смысловое расхождение между названием и поведением чека.

## Проверка

1. `npx tsc --noEmit` в `owndev-backend` — без ошибок.
2. На странице с чёткой темой (Title и H2/H3 про одно) `noMixedTopics` → `pass`.
3. На странице, где H2/H3 «обо всём» — `noMixedTopics` → `fail` с разумным reason.
4. H1 = «Купить кондиционеры в Москве» (28 симв.) → `adHeadlineReady` pass.
5. H1 отсутствует / `<h1>123 — главная</h1>` / H1 длиной 80 симв. → `fail` с конкретной причиной.
6. Лейблы в UI карточек /site-check «Тематическая однородность» и «H1 готов для Директа» отображаются корректно (фронт берёт label из `checks[].label`).

