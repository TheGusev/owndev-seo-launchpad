// SEO метаданные для OWNDEV

export const siteMetadata = {
  title:
    "OWNDEV — Разработка MVP, E2E шифрование, Blockchain & Web3, AI Integration | Turbo MVT",
  description:
    "Полный цикл разработки цифровых продуктов: MVP & SaaS, защищённые коммуникации с E2E шифрованием, blockchain интеграция, SEO & сквозная аналитика, AI Playbooks, Predictive Routing, Turbo MVT A-F тестирование. DevOps и масштабирование.",
  keywords: [
    "разработка MVP",
    "SaaS разработка",
    "E2E шифрование",
    "защищённые коммуникации",
    "разработка мессенджеров",
    "blockchain интеграция",
    "Web3 разработка",
    "смарт-контракты",
    "DeFi интеграция",
    "NFT marketplace",
    "WebRTC",
    "real-time коммуникации",
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
      "Разработка MVP & SaaS, E2E шифрование, Blockchain & Web3 интеграция, AI Playbooks, SEO и сквозная аналитика.",
    images: [
      {
        url: "/opengraph-image.svg",
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
    title: "OWNDEV — Разработка MVP, E2E шифрование, Blockchain & Web3, AI Integration",
    description:
      "Защищённые коммуникации, blockchain интеграция, AI Playbooks, SEO, Turbo MVT, Predictive Routing.",
    images: ["/twitter-card.svg"],
  },

  // Structured Data (Schema.org)
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OWNDEV",
    url: "https://owndev.ru",
    logo: "/logo.svg",
    description:
      "Разработка MVP & SaaS, E2E шифрование, blockchain интеграция, AI Playbooks, SEO и аналитика",
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
