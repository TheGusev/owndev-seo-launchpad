export const copy = {
  meta: {
    title: "OWNDEV — Разработка ONE Messenger и OWN Blockchain",
    description:
      "Создаём экосистему: мессенджер ONE и блокчейн OWN. Разработка, дизайн, инфраструктура.",
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
    subtitle: "Разработка, дизайн и инфраструктура для ONE (мессенджер) и OWN (блокчейн).",
    cta: "Запросить демо",
  },
  solutions: {
    title: "Продукты",
    subtitle: "Экосистема ONE и OWN",
  },
  world: {
    title: "В любой точке мира",
    subtitle: "Строим экосистему продуктов для пользователей и команд на 5 континентах.",
    cta: "Связаться",
  },
  cta: {
    title: "Вопросы?",
    subtitle: "Напиши — подскажем архитектуру, сроки и следующий шаг.",
    button: "Связаться",
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
      {
        name: "LinkedIn",
        href: "https://linkedin.com/company/owndev",
        ariaLabel: "Follow us on LinkedIn",
      },
      { name: "GitHub", href: "https://github.com/owndev", ariaLabel: "Follow us on GitHub" },
      { name: "Twitter", href: "https://twitter.com/owndev", ariaLabel: "Follow us on Twitter" },
    ],
  },
} as const;
