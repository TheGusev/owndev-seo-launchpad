

## QA-аудит OWNDEV — найденные проблемы и план фиксов

### Методология
Код-ревью всех компонентов, проверка структуры данных, навигации, мобильной адаптации, экспортов и маскота.

---

### ❌ BLOCKER (ломает основной сценарий)

Нет критических блокеров обнаружено на уровне кода. Приложение компилируется, маршруты корректны, Edge Function задеплоена.

---

### ❌ MAJOR (мешает работе)

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| M1 | **Ссылка "#about" ведёт в никуда** | `Header.tsx:15`, `Footer.tsx:24` | `href="#about"` — элемента с `id="about"` не существует нигде на сайте. Клик ничего не делает. |
| M2 | **Footer "Контакты" ведёт на #contact, а не на /contacts** | `Footer.tsx:25` | `quickLinks` содержит `{ href: "#contact" }` вместо `{ href: "/contacts", isRoute: true }`. На страницах кроме главной ссылка не работает. |
| M3 | **MinusWordsSection фильтрует только "general"/"thematic"** | `MinusWordsSection.tsx:23-24` | Бэкенд теперь отдаёт `category: "informational"/"irrelevant"/"competitor"/"geo"/"other"`, но UI фильтрует по `type: "general"/"thematic"`. Все минус-слова попадают в "Общие" или вообще не отображаются. |
| M4 | **Footer tool links ведут на несуществующие slug** | `Footer.tsx:30-31` | `/tools/geo-audit` и `/tools/llm-score` — таких маршрутов нет в `App.tsx`. Клик → 404. |

---

### ⚠️ MINOR (косметика / улучшения)

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| m1 | Нет `id="about"` секции на главной | `Index.tsx` | Если ссылка "О нас" нужна — добавить `id="about"` на FAQ или ContactForm. Или убрать ссылку. |
| m2 | ScoreCards не показывает текстовую оценку | `ScoreCards.tsx` | Нет подписей "Отлично"/"Хорошо"/"Критично" под числами. Только label "SEO"/"AI". |
| m3 | Comparison table — нет sticky первой колонки | `ComparisonSection.tsx` | На мобильном скролле таблицы колонка "Функция" уезжает. |
| m4 | ScanForm — кнопка не disabled при пустом инпуте на Hero | `Hero.tsx:120` | Hero form `handleQuickCheck` проверяет `!trimmed` но кнопка не disabled визуально. |
| m5 | Copyright год динамический, но задачей указан 2025 | `Footer.tsx:144` | `new Date().getFullYear()` → показывает 2026. Мелочь, но несоответствие. |

---

### План фиксов (только найденные баги)

#### 1. `src/components/Header.tsx` — убрать мёртвую ссылку "#about"
- Заменить `{ href: "#about", label: "О нас" }` на `{ href: "/contacts", label: "Контакты", isRoute: true }` или убрать дубль (Контакты уже есть в навигации)
- Проще: убрать "О нас" из navLinks, т.к. "Контакты" уже есть

#### 2. `src/components/Footer.tsx` — 3 фикса
- quickLinks: заменить `{ label: "О нас", href: "#about" }` на `{ label: "О нас", href: "/contacts", isRoute: true }` или убрать
- quickLinks: заменить `{ label: "Контакты", href: "#contact" }` на `{ href: "/contacts", isRoute: true }`
- toolLinks: убрать `/tools/geo-audit` и `/tools/llm-score` (несуществующие routes), заменить на реальные: `/tools/semantic-core`, `/tools/internal-links`

#### 3. `src/components/site-check/MinusWordsSection.tsx` — поддержка новых категорий
- Заменить фильтрацию `general/thematic` на группировку по полю `type` (которое маппится из `category` бэкенда)
- Добавить маппинг категорий: `informational → "Информационные"`, `irrelevant → "Нерелевантные"`, `competitor → "Конкуренты"`, `geo → "Регионы"`, `other → "Прочие"`, `general → "Общие"`, `thematic → "Тематические"`
- Рендерить каждую непустую группу отдельным блоком

#### 4. `src/components/Hero.tsx` — disabled кнопка при пустом URL
- Добавить `disabled={!url.trim()}` на Button

#### 5. `src/components/site-check/ScoreCards.tsx` — текстовая оценка
- Добавить `getScoreStatus` label под каждым score: "Отлично"/"Хорошо"/"Требует работы"/"Критично"

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/Header.tsx` | Убрать мёртвую ссылку "#about" |
| `src/components/Footer.tsx` | Починить 3 битых ссылки |
| `src/components/site-check/MinusWordsSection.tsx` | Поддержка новых категорий |
| `src/components/Hero.tsx` | Disabled кнопка при пустом URL |
| `src/components/site-check/ScoreCards.tsx` | Добавить текстовые оценки |

