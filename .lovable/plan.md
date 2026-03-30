

## Полный ребрендинг текстового контента OWNDEV.ru

Только тексты, без изменения структуры, стилей, логики или роутинга. 14 файлов.

### 1. `index.html`
- Строка 7: `<title>OWNDEV — GEO и AI-ready аудит сайта</title>`

### 2. `src/pages/Index.tsx`
- Helmet: новый title, description, og:title, og:description
- JSON-LD `organizationLd.name` description, `websiteLd.description`, `softwareAppLd` description
- og:image оставить как есть

### 3. `src/components/Hero.tsx`
- Бейдж (строка 52): `"✦ Первый GEO-аудитор в Рунете"`
- TypeAnimation (строки 66-73): заменить 4 фразы на:
  - `'SEO Score + LLM Score'`
  - `'GEO-аудит за 60 секунд'`
  - `'AI-ready проверка сайта'`
  - `'llms.txt — новый стандарт'`
- Подзаголовок (строка 83): `"бесплатно и без регистрации"` → `"первый двойной аудит в Рунете"`
- Subtitle (строка 94): новый текст про два слоя аудита
- Stats line (строка 104): `"SEO Score + LLM Score · 200+ ключей · Топ-10 конкурентов · Экспорт"`
- CTA кнопка (строка 128): оставить `"Проверить сайт бесплатно"` (уже ок)
- Вторая кнопка (строка 134): `"Все инструменты"` → `"Смотреть пример отчёта"`, href → `/tools/site-check`
- Placeholder URL input (строка 152): `"https://ваш-сайт.ru"`

### 4. `src/components/ServicesTeaser.tsx`
- services массив — заменить 3 текста на:
  1. `"SEO Score — классический технический аудит"`
  2. `"LLM Score — готовность к AI-выдаче"`
  3. `"llms.txt — инструкция для AI-краулеров"`
- Заголовок h2 (строка 38): `"Почему двойной аудит?"`
- Описание (строка 40-41): `"Классическое SEO уже не достаточно. OWNDEV проверяет сайт по двум слоям — SEO и AI-готовность — в одном отчёте."`
- CTA: `"Обсудить проект"` → `"Запустить GEO-аудит"`
- CTA onClick → navigate to `/tools/site-check`

### 5. `src/components/ToolsShowcase.tsx`
- Заголовок h2 (строка 38-39): `"Инструменты"` `"GEO и AI-ready аудита"`
- Подзаголовок (строка 42): `"13 инструментов для SEO, AI-видимости и конкурентного анализа"`
- Flagship description (строка 7): `"SEO Score + LLM Score, конкуренты, 200+ ключей, экспорт — полный GEO-аудит"`
- Flagship badge (строка 67): `"🏆 GEO-аудит"` вместо `"Главный инструмент"`

### 6. `src/components/FAQ.tsx`
- Заменить 6 вопросов/ответов на новые GEO-ориентированные:
  1. Что такое GEO-аудит?
  2. Чем OWNDEV отличается от PR-CY?
  3. Что такое LLM Score?
  4. Это бесплатно?
  5. Что такое pSEO?
  6. Насколько точен аудит?
- Подзаголовок (строка 92): `"Часто задаваемые вопросы о GEO-аудите и AI-ready SEO"`

### 7. `src/components/ContactForm.tsx`
- Заголовок h2 (строка 134-135): `"Нужна помощь с"` `"GEO-оптимизацией?"`
- Подзаголовок (строка 137-138): `"Если нужны кастомные доработки, GEO-аудит под ключ или сопровождение — напишите нам."`
- services: добавить `"geo-audit": "GEO-аудит под ключ"`, заменить `"seo-audit"` → `"GEO-аудит сайта"`

### 8. `src/components/BlogPreview.tsx`
- Подзаголовок (строка 24): `"Гайды по GEO, LLM Score и AI-ready SEO"`

### 9. `src/components/Header.tsx`
- CTA кнопки (строки 57, 84): `"Проверить сайт"` → `"GEO-аудит"`

### 10. `src/components/Footer.tsx`
- Описание (строка 62): `"Первый в Рунете сервис GEO и AI-ready аудита сайта. SEO Score + LLM Score в одном отчёте."`
- Copyright (строка 113): `"© {new Date().getFullYear()} OWNDEV — GEO & AI-ready аудит"`

### 11. `src/pages/Tools.tsx`
- Helmet title (строка 32): `"Инструменты GEO и AI-ready аудита — бесплатно | OWNDEV"`
- Helmet description (строка 33): обновить
- Badge (строка 71): `"Все инструменты GEO-платформы"`
- h1 (строка 79): `"<span>13 инструментов</span> GEO и AI-ready аудита"`
- Подзаголовок (строка 87): `"Инструменты для SEO, AI-видимости и конкурентного анализа"`
- Flagship description (строка 116): `"SEO Score + LLM Score, топ-10 конкурентов, 200+ ключей, E-E-A-T, Schema и экспорт"`
- Flagship badge (строка 111): `"🏆 GEO-аудит"` вместо `"Флагманский продукт"`

### 12. `src/pages/SiteCheck.tsx`
- h1 (строка ~96): `"Полный GEO и AI-ready аудит сайта"`
- Подзаголовок: `"Проверьте SEO Score и LLM Score сайта бесплатно. Результат — через 60 секунд."`
- checkItems — заменить на 8 пунктов с GEO-формулировками

### 13. `src/components/site-check/ScanForm.tsx`
- Placeholder (строка 44): `"https://ваш-сайт.ru"`
- CTA кнопка (строка 85): `"Запустить GEO-аудит"` / `"Проверяем..."`

### 14. `src/components/site-check/ScanProgress.tsx`
- Steps (строки 5-12): заменить на:
  1. `"Анализируем SEO-параметры"`
  2. `"Рассчитываем LLM Score"`
  3. `"Собираем топ-10 конкурентов"`
  4. `"Генерируем ключевые слова"`
  5. `"Подбираем минус-слова"`
  6. `"Составляем план оптимизации"`
  7. `"Финализация GEO-отчёта"`

### 15. `src/pages/Blog.tsx`
- Helmet title/description — обновить на GEO-тематику
- h1 (строка 69): `"Блог о GEO и AI-ready SEO"`
- Подзаголовок (строка 71): `"Первые в Рунете пишем о GEO, LLM Score и оптимизации для нейросетей"`

### 16. `src/pages/Contacts.tsx`
- Helmet title: `"Контакты OWNDEV — первый GEO-аудитор в Рунете"`
- Helmet description: обновить

### 17. `src/pages/SiteCheckResult.tsx`
- Заголовок отчёта: `"Полный GEO-отчёт"` вместо `"Полный отчёт"`

### Файлы (14 уникальных)

| Файл | Тип изменений |
|------|--------------|
| `index.html` | fallback title |
| `src/pages/Index.tsx` | Helmet + JSON-LD |
| `src/components/Hero.tsx` | все тексты hero |
| `src/components/ServicesTeaser.tsx` | тексты + CTA |
| `src/components/ToolsShowcase.tsx` | заголовки + описания |
| `src/components/FAQ.tsx` | 6 вопросов/ответов |
| `src/components/ContactForm.tsx` | заголовок + услуги |
| `src/components/BlogPreview.tsx` | подзаголовок |
| `src/components/Header.tsx` | CTA текст |
| `src/components/Footer.tsx` | описание + copyright |
| `src/pages/Tools.tsx` | Helmet + тексты |
| `src/pages/SiteCheck.tsx` | заголовок + чеклист |
| `src/pages/Blog.tsx` | Helmet + заголовки |
| `src/pages/Contacts.tsx` | Helmet |
| `src/components/site-check/ScanForm.tsx` | placeholder + CTA |
| `src/components/site-check/ScanProgress.tsx` | шаги прогресса |
| `src/pages/SiteCheckResult.tsx` | заголовок отчёта |

