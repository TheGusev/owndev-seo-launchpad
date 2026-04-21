

## Цель
Убрать эмодзи (⭐ 🚀 🔍 🧠 ⚙️ 🛠 💡 🎯 🤖 и т.п.) из UI и заменить их на чистые **иконки lucide-react** в стиле остального сайта. Сохранить эмодзи только там, где они уместны: подпись «Сделано ❤️ в России 🇷🇺» (правило памяти) и флаги стран в Tech Passport.

## Что меняем

### 1. `src/pages/Tools.tsx` — заголовки групп и флагманов
Сейчас в `TOOL_GROUPS` каждая группа имеет поле `emoji: "🚀"`/`"🔍"`/`"🧠"`/`"⚙️"`/`"🛠"` и в JSX выводится `{group.emoji} {group.title}`.

- Заменить `emoji: string` на `icon: LucideIcon` в `TOOL_GROUPS`:
  | Группа | Было | Станет |
  |---|---|---|
  | Флагманский аудит | 🚀 | `Trophy` |
  | Аудит и анализ | 🔍 | `Search` |
  | AI-видимость и GEO | 🧠 | `BrainCircuit` |
  | Генерация и контент | ⚙️ | `Sparkles` |
  | Утилиты вебмастера | 🛠 | `Wrench` |
- Заголовок флагманского блока `⭐ Флагманские инструменты` → иконка `Star` слева от текста (используем уже импортированный `Star`).
- Рендер: `<group.icon className="w-5 h-5 text-primary" /> {group.title}` вместо `{group.emoji} {group.title}`.

### 2. `src/components/landing/Testimonials.tsx`
Строка 97: `⭐ Отзывы клиентов` → `<Star className="w-3 h-3" /> Отзывы клиентов` (Star уже доступен в lucide).

### 3. `src/components/audit/AuditSectionBlock.tsx`
Строка 74: `💡 {section.whyImportant}` → `<Lightbulb className="w-3 h-3 inline mr-1" /> {section.whyImportant}` (lucide `Lightbulb`).

### 4. `src/pages/SiteCheckResult.tsx`
Строка 277: `title="🚀 AI Boost — план попадания в нейросети"` → `title="AI Boost — план попадания в нейросети"`. Если у `ResultAccordion` есть проп `icon`, передадим `Rocket`; иначе просто убираем эмодзи (визуальная иерархия и так понятна).

### 5. `src/components/mascot/BorderBot.tsx`
Реплики бота — это речевые пузыри, эмодзи в чат-баббле ОК (это персонаж, не UI). **Не трогаем** строки 269 (🎯) и 284 (🤖) — это часть характера маскота, не «AI-style» декор.

### 6. `supabase/functions/site-check-scan/index.ts` (строки 1574, 1591)
В `title` issue: `🤖 Нет FAQPage Schema для AI-видимости` → `Нет FAQPage Schema для AI-видимости`. Эмодзи попадает в выгружаемый отчёт и UI карточки issue — убираем. Аналогично второй title.

### 7. Что **не трогаем** (эмодзи остаются)
- `src/components/Footer.tsx` строка 143: `Сделано ❤️ в России 🇷🇺` — защищено правилом памяти `footer-heart-preference`.
- `src/lib/generateMarketplaceReport.ts` строки 307, 502: та же подпись в PDF/Word.
- `supabase/functions/tech-passport/index.ts` строки 149–150: флаги стран `🇷🇺 🇩🇪 🇳🇱 …` — это семантика данных (страна хостинга), не декор.
- `supabase/functions/send-telegram/index.ts` строки 44–46: 📞 📧 🛠 💬 — это **сервисный текст уведомления в Telegram**, видит только админ, не клиент. Можно оставить, для тона сообщения они уместны.

## Файлы

| Файл | Действие |
|---|---|
| `src/pages/Tools.tsx` | Заменить `emoji` на `icon: LucideIcon` в `TOOL_GROUPS`, обновить рендер заголовков групп и флагманского блока |
| `src/components/landing/Testimonials.tsx` | Заменить `⭐` на `<Star/>` в badge |
| `src/components/audit/AuditSectionBlock.tsx` | Заменить `💡` на `<Lightbulb/>`, добавить импорт |
| `src/pages/SiteCheckResult.tsx` | Убрать `🚀` из title accordion |
| `supabase/functions/site-check-scan/index.ts` | Убрать `🤖` из двух issue title |

## Что НЕ трогаем
- Footer и подписи в экспорт-отчётах (правило памяти).
- Флаги стран в Tech Passport (семантика, не декор).
- Telegram-уведомления (внутренний канал).
- BorderBot реплики (характер маскота).
- Header / навигация.
- Backend пайплайн, маршруты, БД.

## Проверка
1. `/tools` — заголовки групп и флагманского блока без эмодзи, иконки lucide того же стиля что иконки инструментов.
2. Главная — секция «Отзывы клиентов» — badge со звездой-иконкой вместо ⭐.
3. Внутри отчёта аудита — раздел `whyImportant` показывает иконку лампочки вместо 💡.
4. `/result/:id` — accordion «AI Boost» без 🚀 в заголовке.
5. Свежий запуск site-check на сайте без FAQPage — issue называется «Нет FAQPage Schema для AI-видимости» без 🤖.
6. Footer по-прежнему: «Сделано ❤️ в России 🇷🇺».

