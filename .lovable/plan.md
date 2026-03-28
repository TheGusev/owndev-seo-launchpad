

## Оставшиеся незакрытые пункты

После проверки всех файлов — большинство фиксов выполнено корректно. Осталось 3 недоделки:

### 1. ToolsShowcase — site-check не выделен как флагман (FIX 2)

**Текущее состояние:** site-check добавлен первым элементом в локальный массив, но рендерится как обычная карточка в общей сетке. По ТЗ требуется: отдельная большая карточка на всю ширину НАД сеткой, teal gradient border, бейдж "Главный инструмент".

**Что сделать:**
- Выделить первый элемент (site-check) из массива
- Рендерить его отдельной карточкой `col-span-full` перед grid остальных 12
- Стиль: `border border-primary/30`, крупнее, бейдж "Главный инструмент"
- Остальные 12 — в обычной сетке ниже

### 2. ServicesTeaser — скролл к #contact не работает с внутренних страниц (FIX 8)

**Текущее состояние:** `navigate("/#contact")` выполняется, но hash не обрабатывается после навигации — скролл не происходит.

**Что сделать:**
- В `handleContact`: после `navigate("/#contact")` добавить `setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 400)`

### 3. Мелочи DownloadButtons + Tools meta (FIX 11)

- Toast текст: заменить "Генерация PDF-отчётов в разработке. Скоро будет доступно!" на "Генерация отчётов подключается. Мы уведомим вас как только будет готово!"
- `Tools.tsx` meta description (строка 33): "12 бесплатных" → "13 бесплатных"

### Файлы

| Файл | Что |
|------|-----|
| `src/components/ToolsShowcase.tsx` | Flagship карточка отдельно над сеткой |
| `src/components/ServicesTeaser.tsx` | setTimeout scroll после navigate |
| `src/components/site-check/DownloadButtons.tsx` | Toast текст |
| `src/pages/Tools.tsx` | meta description 12→13 |

