

## Добавить кастомную иконку секции в AuditSectionBlock

Сейчас все секции используют только статусные иконки (CheckCircle / AlertTriangle / XCircle). Добавим возможность задавать **секционную иконку** рядом с названием — для Яндекса это будет кастомный SVG-компонент с буквой «Я».

### Изменения

**1. `SectionConfig` — новое опциональное поле `icon`**

В интерфейсе `SectionConfig` добавить `icon?: React.ComponentType<{ className?: string }>`.

**2. `AuditSectionBlock` — отображение иконки секции**

Во всех трёх рендер-ветках (comingSoon, issues=0, accordion) перед `<span>{section.label}</span>` добавить:
```tsx
{section.icon && <section.icon className="w-4 h-4 text-muted-foreground" />}
```

**3. `AuditResultView` — кастомный Yandex-иконка**

Создать inline SVG-компонент `YandexIcon` — стилизованная буква «Я» в круге (красный акцент, стиль Lucide). Назначить его в секцию `yandex-ai`:

```tsx
const YandexIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" fill="rgba(255,0,0,0.15)" />
    <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor" stroke="none">Я</text>
  </svg>
);
```

Затем в `SECTIONS`:
```tsx
{ id: "yandex-ai", label: "ЯндексGPT и Алиса", icon: YandexIcon, categories: [...], ... }
```

### Файлы

| Файл | Строк |
|------|-------|
| `src/components/audit/AuditSectionBlock.tsx` | +5 (поле icon + рендер) |
| `src/components/audit/AuditResultView.tsx` | +12 (YandexIcon + привязка) |

Остальные секции без иконки — поведение не меняется.

