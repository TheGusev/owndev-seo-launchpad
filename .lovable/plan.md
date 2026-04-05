

## Inline-редактирование + XLSX-экспорт для Генератора GEO-страниц

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/tools/PSEOGenerator.tsx` | Добавить inline editing в таблицу + XLSX export кнопку |

### 1. Inline-редактирование

**Механика:** двойной клик по ячейке Title/H1/Description → ячейка превращается в `<input>` / `<textarea>`. При blur или Enter — сохраняет значение в `rows` state. Escape — отмена.

- Новый state: `editingCell: {rowIdx: number, field: string} | null`
- При двойном клике на ячейку Title/H1 в таблице — показать input вместо текста
- При клике на строку (для preview) — оставить одинарный клик, двойной — для редактирования
- Отредактированные ячейки получают визуальный маркер (мелкая иконка Pencil или border-left цветной)
- Новое поле в `PageRow`: `edited?: boolean` — чтобы отмечать изменённые строки
- Функция `updateRow(idx, field, value)` — обновляет `rows` через `setRows`
- В PreviewCard тоже сделать поля кликабельными для редактирования (inline inputs)

### 2. XLSX-экспорт

**Подход:** генерация XLSX на клиенте через библиотеку `xlsx` (SheetJS).

- Установить `xlsx` npm пакет
- Новая функция `handleExportXLSX()`:
  - Создать worksheet из массива `rows` с теми же колонками что в CSV
  - Добавить заголовки колонок
  - Скачать как `geo-pages.xlsx`
- Новая кнопка в grid экспорта (рядом с CSV/JSON/Copy): `XLSX` с иконкой `FileSpreadsheet`

### 3. UI изменения в Step 4

- Таблица: ячейки Title и H1 получают `onDoubleClick` → переключение в edit mode
- Подсказка под таблицей: "Дважды кликните для редактирования"
- Grid кнопок экспорта: 4 кнопки вместо 3 (+ XLSX)
- Import `FileSpreadsheet` из lucide-react

