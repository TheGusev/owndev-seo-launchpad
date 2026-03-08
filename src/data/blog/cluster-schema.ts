import { BlogPost } from './types';

export const clusterSchema: BlogPost[] = [
  {
    slug: "schema-org-razmetka-dlya-ai",
    title: "Schema.org разметка для AI-цитирования",
    description: "Какую JSON-LD разметку добавить на сайт, чтобы LLM и AI-поисковики лучше понимали и цитировали ваш контент.",
    date: "2025-05-28",
    tags: ["Schema.org", "JSON-LD", "LLM"],
    readTime: 7,
    content: `## Зачем Schema.org для LLM

JSON-LD разметка Schema.org — это структурированные данные, которые помогают поисковикам и LLM понять, что на вашей странице. Для AI-цитирования это критично:

- LLM быстрее находит нужную информацию
- Повышается вероятность попадания в AI Overviews
- Улучшается представление в расширенных сниппетах

## Какие типы Schema.org использовать

### Article
Для статей и блог-постов. Обязательные поля:
- \`headline\` — заголовок
- \`author\` — автор с типом Person или Organization
- \`datePublished\` и \`dateModified\`
- \`description\` — краткое описание

### FAQPage
Для страниц с вопросами-ответами. Каждый Q&A пара увеличивает шанс цитирования.

### LocalBusiness
Для локальных бизнесов. Помогает попасть в локальные AI-ответы.

### Product
Для товаров. Включайте цену, наличие, рейтинг.

### HowTo
Для пошаговых инструкций. LLM особенно любит этот тип.

## Как проверить разметку

1. Google Rich Results Test — покажет, какие типы распознаны
2. Schema.org Validator — проверит синтаксис
3. Наш **Schema Generator** — создаст корректную разметку за 2 минуты

## Частые ошибки

- **Несоответствие разметки контенту** — размечаете как FAQ, но на странице нет вопросов
- **Отсутствие обязательных полей** — Schema.org имеет required properties
- **Дублирование** — несколько блоков одного типа на странице
- **Устаревшие форматы** — Microdata вместо JSON-LD

## Пример правильной разметки Article

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Как оптимизировать сайт для LLM",
  "author": {
    "@type": "Organization",
    "name": "OWNDEV"
  },
  "datePublished": "2025-06-01",
  "description": "Практическое руководство по LLM-оптимизации"
}
\`\`\`

## Вывод

Schema.org — это минимальное усилие с максимальным эффектом для AI-цитирования. Начните с Article и FAQPage, затем расширяйте.`
  },
  {
    slug: "faq-razmetka-dlya-llm",
    title: "FAQ разметка для LLM: полный гайд с примерами",
    description: "Как правильно создать FAQPage и HowTo разметку Schema.org, чтобы попасть в AI Overviews и ответы ChatGPT. Примеры кода.",
    date: "2025-07-03",
    tags: ["Schema.org", "JSON-LD", "LLM", "AI Overviews"],
    readTime: 8,
    content: `## Почему FAQ-разметка критична для AI-цитирования

FAQPage — самый эффективный тип Schema.org для попадания в AI-ответы. LLM-модели «любят» формат вопрос-ответ: он идеально подходит для генерации сводок. Страницы с FAQ-разметкой цитируются в AI Overviews в 2.5 раза чаще обычных.

## Как создать FAQPage разметку

### Базовая структура JSON-LD

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое LLM-оптимизация?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LLM-оптимизация — это адаптация контента сайта для цитирования AI-ассистентами: ChatGPT, Perplexity, Google AI Overviews."
      }
    }
  ]
}
\`\`\`

### Правила создания FAQ

1. **Вопросы должны быть реальными** — используйте запросы из Google Search Console, «Люди также спрашивают», форумов
2. **Ответы — конкретными** — 2-4 предложения, без воды
3. **3-7 вопросов на страницу** — не перегружайте
4. **Вопросы релевантны контенту** — FAQ должен дополнять основной текст

## HowTo разметка: пошаговые инструкции

HowTo — второй по эффективности тип для AI-цитирования. LLM активно использует пошаговые инструкции.

### Структура HowTo

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Как провести SEO-аудит сайта",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Проверьте мета-теги",
      "text": "Убедитесь, что на каждой странице есть уникальный Title (до 60 символов) и Meta Description (до 155 символов)."
    },
    {
      "@type": "HowToStep",
      "name": "Проверьте скорость загрузки",
      "text": "Используйте PageSpeed Insights. Целевое значение — менее 3 секунд на мобильных устройствах."
    }
  ]
}
\`\`\`

## Комбинирование FAQ и HowTo на одной странице

Можно использовать оба типа на одной странице через массив @graph:

\`\`\`json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Гайд по SEO-аудиту"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [...]
    }
  ]
}
\`\`\`

## Как быстро создать разметку

Используйте наш **Schema Generator** — выберите тип FAQPage или HowTo, заполните вопросы/шаги, получите готовый JSON-LD. Копируйте в \`<head>\` страницы.

## Частые ошибки FAQ-разметки

- **Вопросы не совпадают с контентом** — разметка есть, а вопросов на странице нет
- **Слишком длинные ответы** — более 300 слов в одном ответе снижают эффективность
- **Рекламные ответы** — FAQ не должен быть рекламой, только полезная информация
- **Дублирование на разных страницах** — одинаковые FAQ на нескольких страницах

## FAQ

**Сколько вопросов оптимально для FAQPage?**
3-7 вопросов на страницу. Больше — Google может проигнорировать часть.

**Можно ли использовать FAQPage на главной странице?**
Да, если на главной есть блок с вопросами. Но эффективнее на тематических страницах.

**Как проверить, работает ли FAQ-разметка?**
Используйте Google Rich Results Test (search.google.com/test/rich-results) — вставьте URL и проверьте.

## Вывод

FAQ и HowTo разметка — самый быстрый способ повысить шансы на AI-цитирование. Создайте разметку нашим **Schema Generator**, проверьте в Google Rich Results Test.`
  },
  {
    slug: "mikrorazmetka-dlya-internet-magazina",
    title: "Микроразметка для интернет-магазина: Product, Offer, Review",
    description: "Полный гайд по Schema.org разметке для ecommerce: Product, Offer, AggregateRating, Review. С примерами JSON-LD кода.",
    date: "2025-07-08",
    tags: ["Schema.org", "JSON-LD", "Ecommerce", "SEO"],
    readTime: 9,
    content: `## Зачем интернет-магазину Schema.org разметка

Правильная микроразметка для интернет-магазина даёт три преимущества: расширенные сниппеты в Google (цена, рейтинг, наличие), попадание в AI Overviews с товарными рекомендациями, и улучшенное понимание каталога поисковыми системами.

## Какие типы разметки нужны ecommerce-сайту

### Product — основа товарной разметки
Каждая карточка товара должна содержать:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Беспроводные наушники Sony WH-1000XM5",
  "description": "Наушники с активным шумоподавлением...",
  "image": "https://example.com/image.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Sony"
  },
  "offers": {
    "@type": "Offer",
    "price": "29990",
    "priceCurrency": "RUB",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Магазин Электроники"
    }
  }
}
\`\`\`

### AggregateRating — рейтинг товара
Добавляет звёздочки в сниппет:

\`\`\`json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.7",
  "reviewCount": "156",
  "bestRating": "5"
}
\`\`\`

### Review — отзывы покупателей
Каждый отзыв размечается отдельно:

\`\`\`json
"review": [
  {
    "@type": "Review",
    "author": {"@type": "Person", "name": "Иван П."},
    "reviewRating": {"@type": "Rating", "ratingValue": "5"},
    "reviewBody": "Отличное шумоподавление, комфортная посадка."
  }
]
\`\`\`

### BreadcrumbList — хлебные крошки
Помогает Google понять структуру каталога:

\`\`\`json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://example.com/"},
    {"@type": "ListItem", "position": 2, "name": "Наушники", "item": "https://example.com/naushniki/"},
    {"@type": "ListItem", "position": 3, "name": "Sony WH-1000XM5"}
  ]
}
\`\`\`

## Разметка для категорий и каталога

Страницы категорий размечайте как ItemList:

\`\`\`json
{
  "@type": "ItemList",
  "name": "Беспроводные наушники",
  "numberOfItems": 24,
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "url": "https://example.com/product-1"},
    {"@type": "ListItem", "position": 2, "url": "https://example.com/product-2"}
  ]
}
\`\`\`

## Как создать разметку быстро

Используйте наш **Schema Generator** — выберите тип Product, заполните поля товара, получите готовый JSON-LD. Для массовой генерации используйте **pSEO Generator** для создания шаблонов.

## Частые ошибки ecommerce-разметки

- **Неактуальная цена** — цена в разметке отличается от цены на странице
- **Фейковые отзывы в разметке** — Google наказывает за выдуманные Review
- **Отсутствие availability** — не указано, в наличии товар или нет
- **Разметка без видимого контента** — размеченные данные должны быть видны пользователю

## FAQ

**Обязательно ли размечать каждый товар?**
Да, чем больше товаров с разметкой, тем лучше Google понимает каталог и чаще показывает расширенные сниппеты.

**Как проверить разметку товара?**
Google Rich Results Test — вставьте URL карточки товара и проверьте все поля.

**Влияет ли товарная разметка на AI Overviews?**
Да — Google AI Overviews использует Product разметку для товарных рекомендаций в ответах.

## Вывод

Микроразметка для интернет-магазина — это обязательный минимум. Product + Offer + AggregateRating = расширенные сниппеты + AI-видимость. Создайте разметку нашим **Schema Generator**.`
  }
];
