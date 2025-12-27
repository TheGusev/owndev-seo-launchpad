export const copy = {
  meta: {
    title: "OWNDEV — Разработка ONE Messenger, OWN Blockchain, MVP & SaaS | AI Integration",
    description:
      "Создаём экосистему децентрализованных продуктов: мессенджер ONE и блокчейн OWN. Полный цикл разработки MVP, SaaS, SEO, AI интеграция.",
  },
  header: {
    logo: "OWNDEV",
    languages: ["RU", "EN"] as const,
    nav: {
      solutions: "Продукты",
      about: "Возможности",
      contact: "Контакты",
    },
  },
  hero: {
    title: "OWNDEV — платформа, которая выводит продукт за пределы орбиты",
    subtitle:
      "Разработка, дизайн и инфраструктура для цифровых продуктов. Создаём мессенджер ONE, блокчейн OWN и строим SaaS-решения на AI.",
    cta: "Запросить демо",
  },
  solutions: {
    title: "Решения",
    subtitle: "Продукты и услуги OWNDEV",
  },
  world: {
    title: "В любой точке мира",
    subtitle:
      "Строим экосистему продуктов для пользователей и команд на 5 континентах. От идеи до масштабирования — полный цикл разработки.",
    cta: "Связаться с нами",
  },
  cta: {
    title: "Вопросы?",
    subtitle:
      "Напиши — подскажем архитектуру, сроки и следующий шаг. Обсудим технологии, бюджет и стратегию запуска.",
    button: "Связаться",
  },
  footer: {
    copyright: "© 2025 OWNDEV. Все права защищены.",
    tagline: "Your Digital Edge",
    followUs: "Follow us",
    links: {
      products: {
        title: "Продукты",
        items: [
          { label: "ONE Messenger", href: "#one-messenger" },
          { label: "OWN Blockchain", href: "#own-blockchain" },
          { label: "Wallet & Payments", href: "#wallet" },
          { label: "Developer Platform", href: "#dev-platform" },
        ],
      },
      services: {
        title: "Услуги",
        items: [
          { label: "Разработка MVP", href: "#mvp-development" },
          { label: "SEO & Аналитика", href: "#seo-analytics" },
          { label: "AI Integration", href: "#ai-integration" },
          { label: "DevOps", href: "#devops-infrastructure" },
        ],
      },
      company: {
        title: "Компания",
        items: [
          { label: "О нас", href: "#about" },
          { label: "Блог", href: "#blog" },
          { label: "Вакансии", href: "#careers" },
          { label: "Контакты", href: "#contacts" },
        ],
      },
      legal: {
        title: "Правовая информация",
        items: [
          { label: "Политика конфиденциальности", href: "/privacy" },
          { label: "Условия использования", href: "/terms" },
        ],
      },
    },
    socials: [
      { name: "Telegram", href: "https://t.me/owndev", ariaLabel: "Follow us on Telegram" },
      { name: "GitHub", href: "https://github.com/owndev", ariaLabel: "Follow us on GitHub" },
      {
        name: "LinkedIn",
        href: "https://linkedin.com/company/owndev",
        ariaLabel: "Follow us on LinkedIn",
      },
      { name: "Twitter", href: "https://twitter.com/owndev", ariaLabel: "Follow us on Twitter" },
    ],
  },
} as const;
