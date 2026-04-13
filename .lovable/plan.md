

## Восстановление блоков отчёта SiteCheckResult

### Изменения — 2 файла

#### 1. `src/pages/SiteCheckResult.tsx`

**a) Расширить поиск directAdMeta (строка 115):**
```ts
const directAdMeta = rawCompetitors.find((c: any) => 
  c._type === 'direct_ad_meta' || 
  c._direct_meta === true || 
  c.ad_suggestion != null ||
  c.readiness_score != null
);
```

**b) Добавить raw-fallback для keywords, minusWords, competitors** — если маппинг дал пустой массив, но raw-данные есть, показать JSON-превью для отладки.

**c) Переупорядочить блоки по новому порядку:**
1. Header
2. ScoreCards
3. Яндекс.Директ (DirectAdPreview + DirectMeta) — сразу после scores, `defaultOpen=false`
4. Технический паспорт — `defaultOpen=false`
5. План исправления — `defaultOpen=true`
6. AI-видимость (LlmJudge) — `defaultOpen=false`
7. Конкуренты — `defaultOpen=false`
8. Ключевые запросы — `defaultOpen=false`
9. Минус-фразы — `defaultOpen=false`
10. GeoRatingNomination
11. llms.txt кнопка
12. DownloadButtons

**d) DirectAdPreview accordion:** изменить `defaultOpen` с `true` на `false`.

#### 2. `src/components/site-check/TechPassport.tsx`

Расширить интерфейс `TechData` и добавить секции:

- **Технологии**: cms, framework, language, server, php_version, wordpress_version — все через Badge chips
- **Сервер / Геолокация**: country_flag + country_code + city, hosting
- **Аналитика**: оставить как есть
- **Мета**: любые дополнительные поля tech (php_version, wordpress_version и т.п.)

Каждая секция с заголовком `text-xs text-muted-foreground uppercase tracking-wider`. Пустые секции не рендерятся.

### Не меняем
- API вызовы, useEffect, useState, getFullScan, judgeLlm, getTechPassport
- Логику маппинга keywords/minusWords (только добавляем raw-fallback)
- Компоненты KeywordsSection, MinusWordsSection, CompetitorsTable, FullReportView

