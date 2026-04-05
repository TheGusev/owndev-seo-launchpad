

## AI-генерация обложек для 28 статей блога

### Подход

Использовать AI-модель генерации изображений (Nano banana — `google/gemini-2.5-flash-image`) через скрипт `lovable_ai.py` для создания 28 уникальных обложек. Сгенерированные PNG загрузить в Supabase Storage bucket, затем обновить `coverImage` в каждом кластере на публичные URL.

### Шаги

**1. Создать Storage bucket `blog-covers` (SQL миграция)**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-covers', 'blog-covers', true);
CREATE POLICY "Public read blog covers" ON storage.objects FOR SELECT USING (bucket_id = 'blog-covers');
CREATE POLICY "Service upload blog covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-covers');
```

**2. Сгенерировать 28 изображений через AI Gateway**

Скрипт: для каждой статьи — промт на английском с описанием темы, стиль: dark tech/futuristic, 800x450, абстрактные формы без текста. Пример промта:
- LLM-оптимизация → "Abstract dark futuristic illustration: neural network nodes glowing cyan and purple, data streams flowing through a digital brain, dark background, no text"
- pSEO → "Abstract dark tech illustration: infinite grid of web pages scaling into horizon, city silhouettes, teal glow, no text"

Генерация батчами по 4-5 изображений с паузами (rate limits). Сохранение в `/tmp/covers/`.

**3. Загрузить в Storage через Edge Function или напрямую**

Загрузить 28 PNG в bucket `blog-covers` через Supabase JS SDK.

**4. Обновить coverImage во всех 6 кластерных файлах**

Заменить Unsplash URL на Storage URL:
```
https://chrsibijgyihualqlabm.supabase.co/storage/v1/object/public/blog-covers/{slug}.png
```

### Файлы

| Файл | Изменение |
|------|-----------|
| SQL миграция | Создать bucket `blog-covers` + RLS |
| Скрипт генерации (временный) | 28 AI-промтов → 28 PNG |
| Скрипт загрузки (временный) | Upload в Storage |
| `src/data/blog/cluster-llm.ts` | Обновить 4 coverImage |
| `src/data/blog/cluster-ai-overviews.ts` | Обновить 5 coverImage |
| `src/data/blog/cluster-pseo.ts` | Обновить 4 coverImage |
| `src/data/blog/cluster-schema.ts` | Обновить 5 coverImage |
| `src/data/blog/cluster-content.ts` | Обновить 5 coverImage |
| `src/data/blog/cluster-technical.ts` | Обновить 5 coverImage |

### Стиль обложек

Единый визуальный язык OWNDEV:
- Тёмный фон (#0a0a0f — #111827)
- Бирюзово-фиолетовые акценты (cyan/teal + purple gradient)
- Абстрактные технологичные формы (сети, потоки данных, геометрия)
- Без текста на изображениях
- Каждая обложка тематически уникальна под содержание статьи

### Объём
1 миграция, ~28 AI-генераций (5-7 минут), обновление 6 файлов кластеров.

