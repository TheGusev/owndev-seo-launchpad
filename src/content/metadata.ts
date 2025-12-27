// SEO метаданные для OWNDEV

export const siteMetadata = {
  title: "OWNDEV — Разработка ONE Messenger, OWN Blockchain, MVP & SaaS | AI Integration",
  description:
    "Создаём экосистему децентрализованных продуктов: безопасный мессенджер ONE и блокчейн OWN. Полный цикл разработки MVP, SaaS, SEO, сквозная аналитика, AI Playbooks, Predictive Routing. Turbo MVT A-F тестирование.",
  keywords: [
    "разработка MVP",
    "SaaS разработка",
    "ONE messenger",
    "OWN blockchain",
    "blockchain разработка",
    "AI integration",
    "SEO оптимизация",
    "сквозная аналитика",
    "AI Playbooks",
    "Predictive Routing",
    "Turbo MVT",
    "A/B тестирование",
    "Next.js разработка",
    "TypeScript",
    "Web3",
    "DeFi",
    "смарт-контракты",
    "децентрализованные приложения",
    "DevOps",
    "CI/CD",
  ],

  // Open Graph (для соцсетей)
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://owndev.ru",
    siteName: "OWNDEV",
    title: "OWNDEV — Ваша платформа для выхода за пределы орбиты",
    description:
      "Разработка, дизайн и инфраструктура для ONE Messenger, OWN Blockchain, MVP & SaaS. AI интеграция, SEO, аналитика.",
    images: [
      {
        url: "https://owndev.ru/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OWNDEV — Разработка цифровых продуктов",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@owndev",
    creator: "@owndev",
    title: "OWNDEV — Разработка ONE, OWN Blockchain, MVP & SaaS",
    description:
      "AI Integration, SEO, Turbo MVT, Predictive Routing. Создаём продукты мирового уровня.",
    images: ["https://owndev.ru/twitter-card.jpg"],
  },

  // Structured Data (Schema.org)
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OWNDEV",
    url: "https://owndev.ru",
    logo: "https://owndev.ru/logo.svg",
    description:
      "Разработка децентрализованных продуктов, MVP, SaaS, AI интеграция, SEO и аналитика",
    sameAs: [
      "https://t.me/owndev",
      "https://github.com/owndev",
      "https://linkedin.com/company/owndev",
      "https://twitter.com/owndev",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Sales",
      email: "hello@owndev.ru",
      availableLanguage: ["Russian", "English"],
    },
  },

  // Canonical URL
  canonical: "https://owndev.ru",

  // Alternate languages
  alternates: {
    canonical: "https://owndev.ru",
    languages: {
      "ru-RU": "https://owndev.ru",
      "en-US": "https://owndev.ru/en",
    },
  },
} as const;
