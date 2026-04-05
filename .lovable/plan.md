

## Полный редизайн pSEO Generator → «Генератор GEO-страниц»

### Обзор

Текущий PSEOGenerator — простая форма (ниша + города → таблица slug/title/h1/meta). Нужно превратить его в полноценный 4-шаговый мастер с hero-блоком, preview, проверкой качества и множественным экспортом.

### Файлы

| Файл | Действие |
|------|----------|
| `src/data/tools-registry.ts` | Переименовать name/shortDesc/useCases |
| `src/components/tools/PSEOGenerator.tsx` | Полная перезапись — 4-шаговый мастер |

### 1. Переименование в tools-registry

```
name: "Генератор GEO-страниц"
shortDesc: "Создаёт структуру сотен SEO-страниц под города, услуги и кластеры спроса"
seoH1: "Генератор GEO-страниц для роста трафика"
useCases: ["Масштабирование локального SEO", "Создание страниц под города и услуги", "Экспорт в CSV / JSON / WordPress"]
```

### 2. Полная перезапись PSEOGenerator.tsx

**Структура компонента:**

```
Hero (serif заголовок + gradient highlight + 3 value-pills)
↓
Sticky Step Indicator (1/2/3/4)
↓
Step 1: "Что генерируем" — ниша, услуги, города, тип страниц
Step 2: "Структура" — тональность, блоки (FAQ, Schema, CTA...), формат URL
Step 3: "Предпросмотр" — счётчик страниц + preview одной страницы + кнопка генерации
Step 4: "Результат" — таблица, preview карточка, качество, экспорт, CTA на другие инструменты
```

**Hero-блок:**
- Serif заголовок: `Генератор <span class="heading-highlight-gradient">GEO-страниц</span> для роста трафика`
- Подзаголовок о результате
- 3 pill-бейджа: "До 500 страниц", "Антидубли", "Экспорт CSV/JSON"

**Step 1 — Что генерируем:**
- Ниша (select + custom input)
- Основные услуги (textarea, по одной на строку)
- Города/локации (textarea)
- Тип страниц (radio-group): услуга+город, категория+город, район, филиал

**Step 2 — Структура:**
- Тональность (select: строгая / коммерческая / экспертная)
- Чекбоксы блоков: intro, преимущества, цены, FAQ, отзывы, schema, CTA
- Формат URL (radio: /service/city, /city/service, /service-in-city)

**Step 3 — Предпросмотр:**
- Блок "Что будет создано": N страниц, N titles, N FAQ, 1 CSV
- Preview-карточка одной страницы (slug, title, h1, description, FAQ, schema type)
- Кнопка "Создать GEO-страницы"

**Step 4 — Результат:**
- Таблица результатов (первые 10 + "Ещё +N")
- Красивый preview одной страницы по клику
- Блок "Проверка качества": уникальность title/h1, риск дублей (цветные статусы)
- Экспорт: CSV, JSON, Copy as table (grid кнопок)
- CTA-ссылки на GEO-аудит, Anti-Duplicate, Семантику

**Генерация данных (расширенная):**
Расширить `PageRow` до:
```typescript
interface PageRow {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  h2_1: string;
  h2_2: string;
  faq: Array<{q: string, a: string}>;
  schemaType: string;
  cta: string;
  duplicateRisk: 'low' | 'medium' | 'high';
}
```

Генерация FAQ (2-3 вопроса на страницу из шаблонов), schema type (Service/FAQPage), CTA текст. Оценка риска дублей — сравнение title uniqueness (если >80% совпадение → high risk).

**Экспорт:**
- CSV с колонками: city, service, slug, title, meta_description, h1, h2_1, h2_2, faq_1_q, faq_1_a, faq_2_q, faq_2_a, schema_json, cta, duplicate_risk
- JSON (массив объектов)
- Copy table (clipboard API)

**Мобильный UX:**
- Sticky progress bar наверху
- Каждый шаг в отдельной glass-карточке
- "Далее" кнопка переключает шаги
- Валидация: следующий шаг недоступен без заполнения предыдущего

**Информационные блоки (аккордеоны внизу):**
- "Зачем нужен инструмент" — для сетей, агентств, франшиз
- "Когда особенно полезен" — 10+ городов, 5+ услуг
- "Что создаёт" — список полей

### Объём

Один файл `PSEOGenerator.tsx` — полная перезапись (~400-500 строк). Плюс обновление записи в `tools-registry.ts`. Всё клиентское, без backend-изменений.

