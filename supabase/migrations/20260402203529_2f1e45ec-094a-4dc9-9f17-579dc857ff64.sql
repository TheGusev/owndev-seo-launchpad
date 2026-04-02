CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL,
  lesson_number integer NOT NULL,
  module_slug text NOT NULL,
  lesson_slug text NOT NULL,
  module_title text NOT NULL,
  title text NOT NULL,
  description text,
  content text NOT NULL DEFAULT 'Контент готовится...',
  reading_time_minutes integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_slug, lesson_slug)
);

ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read academy_lessons" ON public.academy_lessons FOR SELECT TO public USING (true);

INSERT INTO public.academy_lessons (module_number, lesson_number, module_slug, module_title, lesson_slug, title, description, reading_time_minutes) VALUES
(1, 1, 'osnovy-geo', 'Основы GEO', 'chto-takoe-geo', 'Что такое GEO и чем отличается от SEO', 'Разбираемся в ключевых различиях между классическим SEO и Generative Engine Optimization', 8),
(1, 2, 'osnovy-geo', 'Основы GEO', 'kak-nejroseti-vybirayut-istochniki', 'Как нейросети выбирают источники для цитирования', 'Алгоритмы ранжирования источников в AI-ответах', 10),
(1, 3, 'osnovy-geo', 'Основы GEO', 'ai-overviews-perplexity-yandex', 'AI Overviews, Perplexity, Яндекс Нейро — как они работают', 'Обзор основных AI-поисковых систем и их особенностей', 12),
(1, 4, 'osnovy-geo', 'Основы GEO', 'pervyj-geo-audit', 'Ваш первый GEO-аудит на OWNDEV', 'Пошаговое руководство по запуску первого аудита', 8),
(2, 1, 'tekhnicheskaya-podgotovka', 'Техническая подготовка', 'llms-txt', 'llms.txt — файл-инструкция для AI-краулеров', 'Как создать и настроить llms.txt для вашего сайта', 10),
(2, 2, 'tekhnicheskaya-podgotovka', 'Техническая подготовка', 'schema-org', 'Schema.org разметка для AI-видимости', 'Какие типы Schema.org важны для AI-поиска', 12),
(2, 3, 'tekhnicheskaya-podgotovka', 'Техническая подготовка', 'robots-txt-ai', 'robots.txt для AI-ботов', 'Настройка доступа для GPTBot, ClaudeBot, PerplexityBot', 8),
(2, 4, 'tekhnicheskaya-podgotovka', 'Техническая подготовка', 'core-web-vitals-ai', 'Core Web Vitals и их влияние на AI-цитирование', 'Как скорость сайта влияет на попадание в AI-ответы', 10),
(3, 1, 'kontent-dlya-nejrosetej', 'Контент для нейросетей', 'struktura-kontenta', 'Структура контента для AI-парсинга', 'H1-H6, списки, таблицы — форматирование для нейросетей', 10),
(3, 2, 'kontent-dlya-nejrosetej', 'Контент для нейросетей', 'e-e-a-t', 'E-E-A-T: экспертность, авторитетность, доверие', 'Как продемонстрировать экспертность для AI-систем', 12),
(3, 3, 'kontent-dlya-nejrosetej', 'Контент для нейросетей', 'faq-kontent', 'FAQ-контент — главный формат для AI-ответов', 'Почему FAQ — самый цитируемый формат в AI-поиске', 10),
(3, 4, 'kontent-dlya-nejrosetej', 'Контент для нейросетей', 'evergreen-kontent', 'Evergreen-контент: статьи которые не устаревают', 'Как создавать контент с долгим сроком AI-видимости', 8),
(4, 1, 'prodvinutye-tekhniki', 'Продвинутые техники', 'entity-seo', 'Entity SEO — оптимизация по сущностям', 'Как работать с сущностями для повышения AI-видимости', 15),
(4, 2, 'prodvinutye-tekhniki', 'Продвинутые техники', 'pseo', 'Programmatic SEO (pSEO) для масштабирования', 'Автоматическая генерация оптимизированных страниц', 12),
(4, 3, 'prodvinutye-tekhniki', 'Продвинутые техники', 'monitoring-ai-vidimosti', 'Мониторинг AI-видимости: как отслеживать цитирования', 'Инструменты и методы мониторинга AI-упоминаний', 10),
(4, 4, 'prodvinutye-tekhniki', 'Продвинутые техники', 'ai-content-brief', 'AI Content Brief: как ставить ТЗ копирайтеру', 'Шаблон технического задания для AI-оптимизированного контента', 10),
(5, 1, 'strategiya-i-monetizaciya', 'Стратегия и монетизация', 'geo-audit-kak-usluga', 'GEO-аудит как услуга: чек-лист для клиентов', 'Как предлагать GEO-аудит как коммерческую услугу', 12),
(5, 2, 'strategiya-i-monetizaciya', 'Стратегия и монетизация', 'white-label-otchyoty', 'White-label отчёты для агентств', 'Как использовать OWNDEV для клиентских отчётов', 8),
(5, 3, 'strategiya-i-monetizaciya', 'Стратегия и монетизация', 'kejsy-rost-llm-score', 'Кейсы: как LLM Score вырос с 34 до 71 за месяц', 'Реальные примеры успешной GEO-оптимизации', 10),
(5, 4, 'strategiya-i-monetizaciya', 'Стратегия и монетизация', 'dorozhnaya-karta-geo-2026', 'Дорожная карта GEO на 2026 год', 'Тренды и прогнозы развития AI-поиска', 10);