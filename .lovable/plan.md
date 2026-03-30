

# LLM-проверки в Site Check + llms.txt для OWNDEV

## Часть 1: Расширение AI Audit в Edge Function

**Файл:** `supabase/functions/site-check-scan/index.ts`

Функция `aiAudit(html, origin)` — сделать асинхронной, добавить параметр `origin` для fetch проверок. Новые проверки:

1. **Проверка /llms.txt** — `HEAD` запрос на `{origin}/llms.txt`. Если 404 → issue module=ai, severity=high: "Нет файла /llms.txt"
2. **Проверка /llms-full.txt** — аналогично, severity=medium
3. **FAQPage Schema** — уже есть в `schemaAudit`, но добавить перекрёстную проверку в ai модуль: если нет FAQPage в JSON-LD → issue "Нет FAQPage Schema для AI-видимости"
4. **Article/LocalBusiness Schema** — проверка наличия `@type: Article` или `LocalBusiness` в JSON-LD
5. **E-E-A-T сигналы** — поиск блока об авторе (паттерны: `об авторе`, `author`, `автор`, `<address`), даты публикации (`datePublished`, `<time`, `datetime`). Если нет → issue "Нет E-E-A-T сигналов"

Вызов в `runPipeline`: заменить `aiAudit(html)` на `await aiAudit(html, origin)`.

## Часть 2: Кнопка "Скачать llms.txt" в результатах

**Файл:** `src/pages/SiteCheckResult.tsx`

Добавить кнопку "Скачать llms.txt" после DownloadButtons. При клике — генерирует текстовый файл на основе данных скана (url, theme, keywords) и скачивает через `Blob` + `URL.createObjectURL`.

**Новый файл:** `src/utils/generateLlmsTxt.ts`

Функция `generateLlmsTxt(data)` → возвращает строку в формате llms.txt:
```
# {url}
> {theme}

## Offered
- Ключевое слово 1
- Ключевое слово 2

## Links
- {url}: Главная страница
```

## Часть 3: Собственные llms.txt для OWNDEV

**Новый файл:** `public/llms.txt`
```
# OWNDEV
> SEO-оптимизация и разработка SaaS решений. 13 бесплатных SEO-инструментов.

## Offered
- Бесплатная проверка сайта (SEO аудит)
- LLM-Friendly SEO аудитор
- Генератор семантического ядра
- pSEO генератор страниц
- Анализ конкурентов
- Schema.org генератор
...остальные инструменты из registry

## Links
- https://owndev.ru/: Главная
- https://owndev.ru/tools: Все инструменты
- https://owndev.ru/tools/site-check: Проверка сайта
- https://owndev.ru/blog: Блог
- https://owndev.ru/contacts: Контакты
```

**Новый файл:** `public/llms-full.txt` — расширенная версия с описанием каждого инструмента (shortDesc из registry) и списком статей блога.

## Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/site-check-scan/index.ts` | Расширить `aiAudit` — 5 новых проверок, сделать async |
| `src/utils/generateLlmsTxt.ts` | Новый — генерация llms.txt из данных скана |
| `src/pages/SiteCheckResult.tsx` | Кнопка "Скачать llms.txt" |
| `public/llms.txt` | Новый — llms.txt для OWNDEV |
| `public/llms-full.txt` | Новый — расширенный llms-full.txt для OWNDEV |

