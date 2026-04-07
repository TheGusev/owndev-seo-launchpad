

## Интерактивные демо-блоки на страницах сценариев

### Идея

Встроить мини-формы прямо на каждой странице сценария, чтобы пользователь мог начать работу не уходя со страницы. При отправке формы — редирект на соответствующий инструмент с предзаполненным URL/запросом.

### Реализация по сценариям

**1. AI Visibility** — мини-форма аудита (URL-поле + кнопка), при сабмите редирект на `/tools/site-check?url=...`

**2. AI-Ready Content** — поле ввода темы/ключевого слова + кнопка "Создать бриф", редирект на `/tools/content-brief?topic=...`

**3. Brand Presence** — поле ввода названия бренда + кнопка "Проверить бренд", редирект на `/tools/brand-tracker?brand=...`

**4. Monitoring** — поле ввода домена + кнопка "Добавить в мониторинг", редирект на `/geo-rating?url=...`

### Новый компонент

`src/components/scenarios/ScenarioDemoForm.tsx` — универсальный компонент:

```typescript
interface ScenarioDemoFormProps {
  placeholder: string;       // "https://ваш-сайт.ru" или "Название бренда"
  buttonText: string;        // "Запустить аудит"
  targetPath: string;        // "/tools/site-check"
  queryParam: string;        // "url" или "brand" или "topic"
  accentColor: string;       // "cyan" | "violet" | "emerald" | "amber"
  icon: LucideIcon;
}
```

При сабмите — `navigate(\`\${targetPath}?\${queryParam}=\${encodeURIComponent(value)}\`)`.

Визуально: glass-карточка с полем ввода, иконкой и gradient-кнопкой в цвете сценария. Анимация появления через framer-motion.

### Размещение

На каждой странице сценария — между Hero и блоком "Как работает". Заменяет кнопку-ссылку в Hero на scroll до формы (или дублирует — форма как основной CTA).

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/scenarios/ScenarioDemoForm.tsx` | Новый — универсальная мини-форма |
| `src/pages/scenarios/AiVisibility.tsx` | Добавить форму (url → site-check) |
| `src/pages/scenarios/AiReadyContent.tsx` | Добавить форму (topic → content-brief) |
| `src/pages/scenarios/BrandPresence.tsx` | Добавить форму (brand → brand-tracker) |
| `src/pages/scenarios/Monitoring.tsx` | Добавить форму (url → geo-rating) |

### Что НЕ трогаем

Header, Footer, мобильное меню, блок "Последние проверки" — 0 изменений.

### Объём

~60 строк новый компонент, ~10 строк вставки в каждую из 4 страниц.

