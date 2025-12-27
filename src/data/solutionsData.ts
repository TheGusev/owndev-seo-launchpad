export interface SolutionMetric {
  label: string;
  value: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "game" | "betting" | "payment" | "affiliate" | "aml" | "analytics";
  image: string;
  features: string[];
  metrics?: SolutionMetric[];
}

export const solutions: Solution[] = [
  {
    id: "game-aggregator",
    title: "Игровой агрегатор",
    description: "Доступ к огромной библиотеке игр и инструментам персонализации",
    icon: "game",
    image: "https://01.tech/images/home/solutions/cards/1/ru/bg_horizontal@2x.webp",
    features: [
      "Автообновление контента",
      "Гибкие настройки правил показа игр",
      "Инструменты аналитики и отчетности",
      "Быстрая интеграция новых провайдеров",
    ],
    metrics: [
      { label: "игровых провайдеров", value: "150+" },
      { label: "коллекция игр", value: "15 000+" },
    ],
  },
  {
    id: "betting",
    title: "Беттинг",
    description: "Комплексное решение с широким охватом событий и системой управления рисками",
    icon: "betting",
    image: "https://01.tech/images/home/solutions/cards/2/ru/bg_horizontal@2x.webp",
    features: [
      "Система управления рисками",
      "Инструменты аналитики и отчетности",
      "Спортивная геймификация",
    ],
    metrics: [
      { label: "видов спорта", value: "79" },
      { label: "спортивных маркетов", value: "35 000" },
    ],
  },
  {
    id: "payment",
    title: "Платежный модуль",
    description: "Мгновенные транзакции, аналитика в реальном времени и высокая проходимость",
    icon: "payment",
    image: "https://01.tech/images/home/solutions/cards/3/ru/bg_horizontal@2x.webp",
    features: [
      "Широкий выбор поставщиков",
      "Автомаршрутизация и каскадинг",
      "AML и Antifraud, защита от чарджбеков",
    ],
    metrics: [
      { label: "платежных методов", value: "200+" },
    ],
  },
  {
    id: "affiliate",
    title: "Аффилейт платформа",
    description: "Управление партнерами, отслеживание кампаний и автоматизация выплат",
    icon: "affiliate",
    image: "https://01.tech/images/home/solutions/cards/4/ru/bg_horizontal@2x.webp",
    features: [
      "Настройка комиссионных планов",
      "Управление креативами",
      "Поддержка субпартнерства",
      "Интуитивно понятный интерфейс",
      "Аналитика в реальном времени",
    ],
  },
  {
    id: "aml",
    title: "AML & Antifraud",
    description: "Инструменты риск-менеджмента для предотвращения мошенничества",
    icon: "aml",
    image: "https://01.tech/images/home/solutions/cards/5/ru/bg_horizontal@2x.webp",
    features: [
      "Мониторинг транзакций",
      "Обнаружение аномального поведения",
      "Блокировка подозрительных счетов",
      "Интеграция со сторонними KYC сервисами",
    ],
  },
  {
    id: "analytics",
    title: "Аналитика",
    description: "Мгновенное обновление данных, анализ поведения игроков и актуальные метрики",
    icon: "analytics",
    image: "https://01.tech/images/home/solutions/cards/6/ru/bg_horizontal@2x.webp",
    features: [
      "Мониторинг метрик в онлайн-режиме",
      "Функционал А/В-тестирования",
      "ML-прогнозирование",
      "Кастомизируемые дашборды",
    ],
  },
];
