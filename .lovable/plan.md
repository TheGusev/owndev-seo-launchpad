

## Исправить падение мобильной версии при раскрытии подробностей в GEO Рейтинге

### Проблема
При нажатии «развернуть» на мобильном экране страница падает в белый экран. Причина — `JSON.parse(r.top_errors)` бросает исключение, если `top_errors` содержит невалидный JSON, `null` или не-строковое значение. Парсинг происходит в двух местах без try/catch.

### Решение

#### 1. Безопасный парсинг `top_errors` в `GeoRating.tsx` (строка 77)
Обернуть `JSON.parse` в try/catch, чтобы при ошибке возвращался пустой массив `[]`.

#### 2. Безопасный парсинг в `mapDbRowToEntry` (`src/data/geo-rating-types.ts`, строка 60)
Аналогично — try/catch вокруг `JSON.parse`, fallback на `[]`.

#### 3. Защита от null/undefined в шаблоне
Добавить optional chaining для `entry.topErrors?.length` и `entry.topErrors?.slice(0, 3)` в expanded-секции (строки 377-393).

### Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/pages/GeoRating.tsx` | Safe parse + optional chaining в expanded блоке |
| `src/data/geo-rating-types.ts` | Safe parse в `mapDbRowToEntry` |

Минимальное изменение — 2 файла, ~10 строк. Никаких новых зависимостей.

