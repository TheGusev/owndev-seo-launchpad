export interface AcademyLesson {
  id: string;
  module_number: number;
  lesson_number: number;
  module_slug: string;
  lesson_slug: string;
  module_title: string;
  title: string;
  description: string | null;
  reading_time_minutes: number;
  content: string;
}

export interface AcademyModuleMeta {
  number: number;
  slug: string;
  title: string;
}

export const academyModules: AcademyModuleMeta[] = [
  { number: 1, slug: 'osnovy-geo', title: 'Основы GEO' },
  { number: 2, slug: 'tehnicheskaya-optimizatsiya', title: 'Техническая оптимизация' },
];

export const academyLessons: AcademyLesson[] = [
  {
    id: '1',
    module_number: 1,
    lesson_number: 1,
    module_slug: 'osnovy-geo',
    lesson_slug: 'chto-takoe-geo',
    module_title: 'Основы GEO',
    title: 'Что такое GEO и почему это важно',
    description:
      'Введение в Generative Engine Optimization — как AI-системы выбирают источники для ответов',
    reading_time_minutes: 15,
    content: `## Что такое GEO?

Generative Engine Optimization (GEO) — это оптимизация сайта для попадания в ответы AI-систем: ChatGPT, Gemini, Яндекс Нейро, Alice и других.

### Почему это важно?

В 2026 году более 40% поисковых запросов обрабатываются с участием AI. Если ваш сайт не оптимизирован для GEO — вы теряете видимость в новом поколении поиска.

### Чем GEO отличается от SEO?

SEO — оптимизация для поисковых роботов (Googlebot, YandexBot).
GEO — оптимизация для языковых моделей, которые синтезируют ответы.

### Ключевые принципы GEO:
1. Структурированный контент — чёткие ответы на конкретные вопросы
2. Schema.org разметка — машиночитаемые данные
3. Файл llms.txt — манифест для AI-систем
4. E-E-A-T — экспертность, авторитетность, достоверность
5. Цитируемость — контент который хочется процитировать`,
  },
  {
    id: '2',
    module_number: 1,
    lesson_number: 2,
    module_slug: 'osnovy-geo',
    lesson_slug: 'llms-txt',
    module_title: 'Основы GEO',
    title: 'Файл llms.txt — что это и как настроить',
    description: 'Как создать llms.txt чтобы AI-системы правильно понимали ваш сайт',
    reading_time_minutes: 10,
    content: `## Файл llms.txt

Аналог robots.txt, но для языковых моделей. Рассказывает AI-системам что есть на вашем сайте и как это использовать.

### Зачем нужен llms.txt?

Языковые модели при обучении и при поиске информации сканируют сайты. llms.txt помогает им понять структуру вашего сайта и правильно атрибутировать информацию.

### Пример llms.txt:

\`\`\`
# Название сайта

> Краткое описание что делает сайт (1-2 предложения)

## Разделы

- [Название раздела](/path): Описание что здесь находится
- [Блог](/blog): Статьи о GEO и SEO оптимизации

## Контакт

- Email: contact@example.ru
\`\`\`

### Как разместить?

Файл должен быть доступен по адресу: https://вашсайт.ru/llms.txt`,
  },
  {
    id: '3',
    module_number: 2,
    lesson_number: 1,
    module_slug: 'tehnicheskaya-optimizatsiya',
    lesson_slug: 'schema-org-dlya-geo',
    module_title: 'Техническая оптимизация',
    title: 'Schema.org разметка для GEO',
    description: 'Какие типы разметки повышают видимость сайта в ответах AI-систем',
    reading_time_minutes: 20,
    content: `## Schema.org и GEO

AI-системы активно используют структурированные данные для формирования ответов. Правильная разметка повышает шансы попасть в AI-ответ.

### Приоритетные типы для GEO:

**1. FAQPage** — самый важный для GEO
\`\`\`json
{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Вопрос пользователя?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Чёткий ответ на вопрос"
    }
  }]
}
\`\`\`

**2. HowTo** — для инструкций
**3. Article** — для статей с автором
**4. LocalBusiness** — для локального бизнеса
**5. Product** — для товаров и услуг`,
  },
  {
    id: '4',
    module_number: 2,
    lesson_number: 2,
    module_slug: 'tehnicheskaya-optimizatsiya',
    lesson_slug: 'robots-txt-dlya-ai',
    module_title: 'Техническая оптимизация',
    title: 'robots.txt и AI-боты',
    description: 'Как настроить robots.txt чтобы не заблокировать AI-краулеры',
    reading_time_minutes: 8,
    content: `## robots.txt и AI-краулеры

Многие сайты случайно блокируют AI-ботов в robots.txt — это снижает GEO-видимость.

### Основные AI-краулеры:

- GPTBot (OpenAI ChatGPT)
- Google-Extended (Gemini)
- anthropic-ai (Claude)
- PerplexityBot
- YouBot

### Правильная настройка:

\`\`\`
# Разрешить всем AI-ботам
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /
\`\`\`

Если хотите закрыть определённые разделы — закрывайте точечно, не весь сайт.`,
  },
];

export function getAllLessons(): AcademyLesson[] {
  return [...academyLessons].sort(
    (a, b) =>
      a.module_number - b.module_number || a.lesson_number - b.lesson_number,
  );
}

export function getLessonBySlug(
  moduleSlug: string,
  lessonSlug: string,
): AcademyLesson | null {
  return (
    academyLessons.find(
      (l) => l.module_slug === moduleSlug && l.lesson_slug === lessonSlug,
    ) ?? null
  );
}

export function getLessonsByModuleSlug(moduleSlug: string): AcademyLesson[] {
  return academyLessons
    .filter((l) => l.module_slug === moduleSlug)
    .sort((a, b) => a.lesson_number - b.lesson_number);
}