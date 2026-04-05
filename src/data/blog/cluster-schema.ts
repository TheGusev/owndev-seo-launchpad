import { BlogPost } from './types';

export const clusterSchema: BlogPost[] = [
  {
    slug: "schema-org-razmetka-dlya-ai",
    title: "Schema.org разметка для AI-цитирования",
    description: "Какую JSON-LD разметку добавить на сайт, чтобы LLM и AI-поисковики лучше понимали и цитировали ваш контент.",
    date: "2025-05-28",
    tags: ["Schema.org", "JSON-LD", "LLM"],
    readTime: 7,
    author: "OWNDEV Team",
    authorRole: "SEO & AI эксперты",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
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
    author: "OWNDEV Team",
    authorRole: "SEO & AI эксперты",
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
    author: "OWNDEV Team",
    authorRole: "SEO & AI эксперты",
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
  },
  {
    slug: "schema-faqpage-howto-polnoe-rukovodstvo",
    title: "Schema FAQPage и HowTo: полное руководство с примерами JSON-LD",
    description: "Детальный гайд по FAQPage и HowTo разметке Schema.org: когда использовать, как комбинировать, ошибки и лучшие практики.",
    date: "2025-08-05",
    tags: ["Schema.org", "JSON-LD", "FAQ", "SEO"],
    readTime: 10,
    author: "OWNDEV Team",
    authorRole: "SEO & AI эксперты",
    content: `## Когда использовать FAQPage, а когда HowTo

FAQPage и HowTo — два самых эффективных типа Schema.org для AI-цитирования. Но использовать их нужно правильно: FAQPage для страниц с вопросами-ответами, HowTo для пошаговых инструкций. Путаница между ними — частая ошибка.

## FAQPage: полный разбор

### Когда использовать FAQPage
- Страница содержит блок «Часто задаваемые вопросы»
- Вопросы и ответы видны пользователю (не скрыты)
- Вопросы реальные — из поиска, форумов, отдела поддержки

### Когда НЕ использовать FAQPage
- На странице нет видимых вопросов-ответов
- Вопросы рекламные: «Почему мы лучшие?»
- Весь контент — один большой FAQ (лучше разбить на статьи)

### Структура FAQPage JSON-LD

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Как добавить Schema.org на сайт?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Добавьте JSON-LD скрипт в <head> или <body> страницы. Используйте генератор разметки для создания корректного кода."
      }
    },
    {
      "@type": "Question",
      "name": "Сколько вопросов можно добавить в FAQPage?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Технически — неограниченно, но оптимально 3-7 вопросов. Google может игнорировать избыточные."
      }
    }
  ]
}
\`\`\`

### Правила ответов в FAQPage
- **Длина**: 50-300 слов на ответ
- **Формат**: можно использовать HTML в ответе (ссылки, списки, жирный текст)
- **Содержание**: конкретный ответ, не реклама
- **Уникальность**: не дублируйте одинаковые FAQ на разных страницах

## HowTo: полный разбор

### Когда использовать HowTo
- Страница содержит пошаговую инструкцию
- Шаги последовательны и логичны
- Каждый шаг имеет чёткое действие

### Структура HowTo JSON-LD

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Как создать Schema.org разметку для сайта",
  "description": "Пошаговая инструкция по добавлению JSON-LD разметки",
  "totalTime": "PT15M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "RUB",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Определите тип разметки",
      "text": "Выберите подходящий тип Schema.org: Article для статей, FAQPage для FAQ, Product для товаров."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Сгенерируйте JSON-LD код",
      "text": "Используйте Schema Generator для создания корректного кода. Заполните обязательные поля."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Добавьте код на страницу",
      "text": "Вставьте JSON-LD скрипт в <head> страницы или перед </body>."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Проверьте разметку",
      "text": "Используйте Google Rich Results Test для проверки корректности разметки."
    }
  ]
}
\`\`\`

### Дополнительные поля HowTo
- **totalTime** — общее время выполнения (формат ISO 8601: PT15M = 15 минут)
- **estimatedCost** — стоимость (если бесплатно — укажите 0)
- **tool** — необходимые инструменты
- **supply** — необходимые материалы

## Как комбинировать FAQPage и HowTo

На одной странице можно использовать оба типа через @graph:

\`\`\`json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Полный гайд по Schema.org разметке",
      "author": {"@type": "Organization", "name": "OWNDEV"},
      "datePublished": "2025-08-01"
    },
    {
      "@type": "HowTo",
      "name": "Как добавить Schema.org на сайт",
      "step": [...]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [...]
    }
  ]
}
\`\`\`

Это даёт максимальный шанс на расширенные сниппеты и AI-цитирование. Подробнее о базовой разметке читайте в статье [Schema.org разметка для AI-цитирования](/blog/schema-org-razmetka-dlya-ai).

## Быстрое создание разметки

Используйте наш [Schema Generator](/tools/schema-generator):
1. Выберите тип: FAQPage или HowTo
2. Заполните вопросы/шаги
3. Скопируйте готовый JSON-LD
4. Проверьте в Google Rich Results Test

## Типичные ошибки

- **FAQ без видимых вопросов** — разметка есть, вопросов на странице нет → Google проигнорирует
- **HowTo для нелинейного процесса** — если шаги можно выполнять в любом порядке, HowTo не подходит
- **Слишком много FAQ** — более 10 вопросов Google может проигнорировать
- **Дублирование FAQ** — одинаковые вопросы на разных страницах → каннибализация

## FAQ

**Можно ли использовать FAQPage на каждой странице сайта?**
Нет — только на страницах, где есть видимый блок вопросов-ответов. Google наказывает за злоупотребление.

**Какой тип разметки даёт больше трафика?**
FAQPage даёт больше показов в расширенных сниппетах. HowTo даёт более качественные клики с высоким intent.

**Поддерживает ли Google HowTo разметку в AI Overviews?**
Да — пошаговые инструкции из HowTo часто цитируются в AI Overviews, особенно для запросов «как сделать...».

**Нужно ли обновлять FAQ-разметку при изменении контента?**
Да — разметка должна соответствовать видимому контенту. Несоответствие может привести к ручным санкциям.

## Вывод

FAQPage и HowTo — самые эффективные типы Schema.org для AI-видимости. Создайте их нашим [Schema Generator](/tools/schema-generator), проверьте в Google Rich Results Test, и не забывайте обновлять при изменении контента.`
  },
  {
    slug: "schema-dlya-saas-i-instrumentov",
    title: "Schema.org для SaaS и онлайн-инструментов: SoftwareApplication разметка",
    description: "Как правильно разметить SaaS-продукт и онлайн-инструменты с помощью Schema.org SoftwareApplication. Примеры JSON-LD для AI-видимости.",
    date: "2025-08-10",
    tags: ["Schema.org", "JSON-LD", "SaaS", "SEO"],
    readTime: 8,
    author: "OWNDEV Team",
    authorRole: "SEO & AI эксперты",
    content: `## Зачем SaaS нужна Schema.org разметка

SaaS-продукты и онлайн-инструменты конкурируют в AI-выдаче за запросы формата «лучший инструмент для...», «онлайн [инструмент] бесплатно», «альтернативы [продукту]». SoftwareApplication разметка помогает Google и LLM понять ваш продукт — его функции, цену, платформу, рейтинг.

## Какие типы Schema.org подходят для SaaS

### SoftwareApplication — основной тип
Для любого программного продукта: веб-приложения, мобильные приложения, десктопные программы, онлайн-инструменты.

### WebApplication — для веб-сервисов
Подтип SoftwareApplication для продуктов, работающих в браузере. Идеально для SaaS.

### MobileApplication — для мобильных приложений
Если у вашего SaaS есть мобильное приложение.

## Полный пример SoftwareApplication

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "OWNDEV SEO Auditor",
  "description": "Бесплатный онлайн SEO-аудитор с проверкой LLM-пригодности контента",
  "url": "https://owndev.ru/tools/seo-auditor",
  "applicationCategory": "SEO Tool",
  "operatingSystem": "Web browser",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB",
    "availability": "https://schema.org/OnlineOnly"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  },
  "author": {
    "@type": "Organization",
    "name": "OWNDEV",
    "url": "https://owndev.ru"
  },
  "featureList": [
    "SEO аудит по 30+ параметрам",
    "Проверка LLM-пригодности",
    "Анализ Schema.org разметки",
    "Проверка Core Web Vitals"
  ]
}
\`\`\`

## Обязательные поля для SaaS разметки

- **name** — название продукта
- **description** — что делает продукт (100-200 символов)
- **applicationCategory** — категория (SEO Tool, Project Management, CRM и т.д.)
- **offers** — цена и модель (бесплатно, подписка, разовая покупка)
- **operatingSystem** — платформа (Web browser, iOS, Android, Windows)

## Дополнительные поля для AI-видимости

### featureList — список функций
\`\`\`json
"featureList": [
  "Автоматический SEO-аудит",
  "Генерация Schema.org разметки",
  "Мониторинг позиций",
  "Анализ конкурентов"
]
\`\`\`

LLM активно использует featureList для ответов на запросы «что умеет [продукт]», «функции [продукта]».

### screenshot — скриншоты интерфейса
\`\`\`json
"screenshot": {
  "@type": "ImageObject",
  "url": "https://example.com/screenshot.png",
  "caption": "Интерфейс SEO Auditor"
}
\`\`\`

### softwareVersion — версия
Помогает показать актуальность продукта.

## Разметка страницы с несколькими инструментами

Если на странице представлены несколько инструментов (как на нашей странице [Инструменты](/tools)), используйте ItemList:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "SEO-инструменты OWNDEV",
  "numberOfItems": 12,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "WebApplication",
        "name": "SEO Auditor",
        "url": "https://owndev.ru/tools/seo-auditor"
      }
    }
  ]
}
\`\`\`

## Разметка для страницы сравнения

Для страниц «X vs Y» или «альтернативы X» используйте комбинацию:

\`\`\`json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Top 5 SEO Auditor Tools 2025"
    },
    {
      "@type": "ItemList",
      "itemListElement": [...]
    }
  ]
}
\`\`\`

## Как это помогает в AI-выдаче

AI-модели используют SoftwareApplication разметку для:

- **Рекомендаций инструментов**: «лучший бесплатный SEO-аудитор» → цитируют ваш продукт с ценой и функциями
- **Сравнений**: «X vs Y» → данные из featureList и offers
- **Ответов на вопросы**: «сколько стоит [продукт]» → цена из offers

Создайте разметку нашим [Schema Generator](/tools/schema-generator) и проверьте сайт нашим [SEO Auditor](/tools/seo-auditor). О влиянии Schema.org на AI-цитирование читайте в статье [Schema.org разметка для AI-цитирования](/blog/schema-org-razmetka-dlya-ai).

## FAQ

**Нужна ли SoftwareApplication разметка, если продукт бесплатный?**
Да — укажите price: 0. Бесплатные инструменты с разметкой получают больше расширенных сниппетов.

**Можно ли использовать WebApplication для мобильного приложения?**
Нет — используйте MobileApplication. Тип должен соответствовать платформе.

**Как обновлять разметку при изменении цен?**
Автоматизируйте: генерируйте JSON-LD динамически из базы данных, чтобы цена в разметке всегда актуальна.

**Влияет ли aggregateRating на позиции в поиске?**
На позиции — нет, но на CTR — да. Звёздочки в сниппете повышают CTR на 20-30%.

## Вывод

SoftwareApplication разметка — must-have для SaaS. Она даёт расширенные сниппеты, AI-цитирование и лучшее понимание продукта поисковиками.`
  }
];
