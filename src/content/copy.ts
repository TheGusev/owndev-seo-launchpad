export const copy = {
  meta: {
    title: "OWNDEV — Ваша платформа для выхода за пределы орбиты",
    description: "Веб-разработка, мобильные приложения, автоматизация бизнеса. Создаем цифровые продукты мирового уровня.",
  },
  header: {
    logo: "OWNDEV",
    languages: ["RU", "EN"] as const,
    nav: {
      solutions: "Решения",
      about: "О нас",
      contact: "Контакты",
    },
  },
  hero: {
    title: "Ваша платформа для выхода за пределы орбиты",
    subtitle: "Веб-приложения, мобильные приложения, автоматизация бизнеса",
    cta: "Связаться с нами",
  },
  solutions: {
    title: "Решения",
    subtitle: "Технологии для вашего бизнеса",
  },
  world: {
    title: "В любой точке мира",
    subtitle: "Создаем лучший развлекательный опыт на 5 континентах",
    cta: "Связаться с нами",
  },
  cta: {
    title: "Вопросы?",
    subtitle: "Мы готовы помочь вам с любым проектом. Свяжитесь с нами, и мы обсудим вашу идею.",
    button: "Связаться с нами",
  },
  footer: {
    copyright: "© 2024 OWNDEV. Все права защищены.",
    followUs: "Follow us",
    links: {
      company: {
        title: "Компания",
        items: [
          { label: "О нас", href: "#about" },
          { label: "Карьера", href: "#careers" },
          { label: "Контакты", href: "#contact" },
        ],
      },
      legal: {
        title: "Правовая информация",
        items: [
          { label: "Политика конфиденциальности", href: "#privacy" },
          { label: "Условия использования", href: "#terms" },
        ],
      },
    },
    socials: [
      { name: "Telegram", href: "https://t.me/owndev", ariaLabel: "Follow us on Telegram" },
      { name: "LinkedIn", href: "https://linkedin.com/company/owndev", ariaLabel: "Follow us on LinkedIn" },
      { name: "GitHub", href: "https://github.com/owndev", ariaLabel: "Follow us on GitHub" },
      { name: "Twitter", href: "https://twitter.com/owndev", ariaLabel: "Follow us on Twitter" },
    ],
  },
} as const;
