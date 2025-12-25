import { 
  Layout, 
  Building2, 
  ShoppingCart, 
  Layers, 
  Search, 
  Headphones
} from "lucide-react";

export const solutions = [
  {
    id: "landing",
    icon: Layout,
    title: "Лендинг",
    description: "Продающие одностраничники с высокой конверсией для вашего бизнеса",
    metric: 30,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-primary",
    colSpan: 2 as const,
    rowSpan: 1 as const,
    featured: true,
    expandedContent: {
      fullDescription: "Создаём лендинги, которые не просто красиво выглядят, но и приносят реальные результаты. Каждый элемент страницы продуман с точки зрения конверсии — от заголовков до призывов к действию.",
      features: [
        "A/B тестирование",
        "Адаптивный дизайн",
        "SEO-оптимизация",
        "Интеграция с CRM",
        "Аналитика конверсий",
        "Формы захвата лидов"
      ],
      technologies: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
      timeline: "2-4 недели",
      price: "от 50 000 ₽"
    }
  },
  {
    id: "corporate",
    icon: Building2,
    title: "Корпоративный сайт",
    description: "Представительство вашей компании в интернете с полным функционалом",
    metric: 25,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-accent",
    colSpan: 1 as const,
    rowSpan: 2 as const,
    expandedContent: {
      fullDescription: "Разрабатываем корпоративные сайты, которые отражают ценности вашего бренда и помогают выстраивать доверие с клиентами. Многостраничная структура с продуманной навигацией.",
      features: [
        "Многостраничная структура",
        "Блог и новости",
        "Личный кабинет",
        "Мультиязычность",
        "Система управления контентом",
        "Интеграция с 1С"
      ],
      technologies: ["React", "TypeScript", "Supabase", "Tailwind CSS"],
      timeline: "4-8 недель",
      price: "от 150 000 ₽"
    }
  },
  {
    id: "ecommerce",
    icon: ShoppingCart,
    title: "Интернет-магазин",
    description: "E-commerce решения с интеграцией платежей и CRM-систем",
    metric: 15,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-primary",
    colSpan: 1 as const,
    rowSpan: 1 as const,
    expandedContent: {
      fullDescription: "Полноценные интернет-магазины с каталогом товаров, корзиной, оплатой онлайн и интеграцией с системами учёта. Оптимизированы для конверсии и повторных покупок.",
      features: [
        "Каталог товаров",
        "Корзина и оформление заказа",
        "Онлайн-оплата",
        "Интеграция с доставкой",
        "Личный кабинет покупателя",
        "Система скидок и промокодов"
      ],
      technologies: ["React", "Stripe", "Supabase", "Node.js"],
      timeline: "6-12 недель",
      price: "от 300 000 ₽"
    }
  },
  {
    id: "saas",
    icon: Layers,
    title: "SaaS-платформа",
    description: "Сложные веб-приложения с личными кабинетами и API",
    metric: 10,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-accent",
    colSpan: 2 as const,
    rowSpan: 1 as const,
    expandedContent: {
      fullDescription: "Разрабатываем SaaS-платформы под ключ: от проектирования архитектуры до запуска в продакшн. Масштабируемые решения с подписочной моделью монетизации.",
      features: [
        "Система подписок",
        "Мультитенантность",
        "REST / GraphQL API",
        "Аналитика и дашборды",
        "Интеграции по вебхукам",
        "Автоматический биллинг"
      ],
      technologies: ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
      timeline: "3-6 месяцев",
      price: "от 500 000 ₽"
    }
  },
  {
    id: "seo",
    icon: Search,
    title: "SEO-оптимизация",
    description: "Продвижение сайтов в поисковых системах и увеличение трафика",
    metric: 50,
    metricSuffix: "+",
    metricLabel: "клиентов",
    color: "text-primary",
    colSpan: 1 as const,
    rowSpan: 1 as const,
    expandedContent: {
      fullDescription: "Комплексное SEO-продвижение: от технического аудита до контент-маркетинга. Увеличиваем органический трафик и выводим сайты в топ поисковой выдачи.",
      features: [
        "Технический аудит",
        "Оптимизация скорости",
        "Контент-стратегия",
        "Линкбилдинг",
        "Локальное SEO",
        "Ежемесячные отчёты"
      ],
      technologies: ["Ahrefs", "Screaming Frog", "Google Search Console", "Semrush"],
      timeline: "от 3 месяцев",
      price: "от 30 000 ₽/мес"
    }
  },
  {
    id: "support",
    icon: Headphones,
    title: "Техподдержка",
    description: "Круглосуточная поддержка и обслуживание ваших проектов",
    metric: 24,
    metricSuffix: "/7",
    metricLabel: "доступность",
    color: "text-accent",
    colSpan: 1 as const,
    rowSpan: 1 as const,
    expandedContent: {
      fullDescription: "Обеспечиваем бесперебойную работу ваших проектов: мониторинг, обновления, резервное копирование и оперативное решение любых проблем.",
      features: [
        "Мониторинг 24/7",
        "Резервное копирование",
        "Обновления безопасности",
        "Оптимизация производительности",
        "Приоритетная поддержка",
        "SLA до 99.9%"
      ],
      technologies: ["AWS", "CloudFlare", "Sentry", "Grafana"],
      timeline: "постоянно",
      price: "от 15 000 ₽/мес"
    }
  }
];

export type Solution = typeof solutions[0];
