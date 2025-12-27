export interface SolutionMetric {
  label: string;
  value: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "games" | "betting" | "payment" | "affiliate" | "aml" | "analytics";
  image: string;
  features: string[];
  metrics?: SolutionMetric[];
}

export const solutions: Solution[] = [
  {
    id: "one-messenger",
    title: "ONE Messenger",
    description: "Безопасный мессенджер с E2E шифрованием",
    icon: "games",
    image: "https://01.tech/images/home/solutions/cards/1/ru/bg_horizontal@2x.webp",
    features: [
      "Сквозное шифрование (E2E)",
      "Групповые чаты и каналы",
      "Голосовые и видеозвонки",
      "Самоуничтожающиеся сообщения",
    ],
    metrics: [
      { label: "статус", value: "MVP" },
      { label: "прогресс", value: "в разработке" },
    ],
  },
  {
    id: "own-blockchain",
    title: "OWN Blockchain",
    description: "Высокопроизводительный блокчейн для dApps",
    icon: "betting",
    image: "https://01.tech/images/home/solutions/cards/2/ru/bg_horizontal@2x.webp",
    features: [
      "Консенсус PoS + BFT",
      "10 000+ TPS",
      "Смарт-контракты на Rust",
      "Низкие комиссии",
    ],
    metrics: [
      { label: "статус", value: "Testnet" },
      { label: "запуск", value: "Q2 2025" },
    ],
  },
  {
    id: "wallet-payments",
    title: "Wallet & Payments",
    description: "Криптокошелёк с DeFi возможностями",
    icon: "payment",
    image: "https://01.tech/images/home/solutions/cards/3/ru/bg_horizontal@2x.webp",
    features: [
      "Мультивалютный кошелёк",
      "DEX интеграция",
      "Стейкинг и фарминг",
      "Fiat on/off ramp",
    ],
    metrics: [
      { label: "сетей", value: "10+" },
    ],
  },
  {
    id: "developer-platform",
    title: "Developer Platform",
    description: "SDK и API для создания dApps",
    icon: "affiliate",
    image: "https://01.tech/images/home/solutions/cards/4/ru/bg_horizontal@2x.webp",
    features: [
      "JavaScript/TypeScript SDK",
      "REST и WebSocket API",
      "Шаблоны смарт-контрактов",
      "Подробная документация",
    ],
    metrics: [
      { label: "статус", value: "Open Beta" },
    ],
  },
  {
    id: "security-compliance",
    title: "Security & Compliance",
    description: "Аудит смарт-контрактов и безопасность",
    icon: "aml",
    image: "https://01.tech/images/home/solutions/cards/5/ru/bg_horizontal@2x.webp",
    features: [
      "Аудит смарт-контрактов",
      "Пентестинг dApps",
      "Bug bounty программа",
      "Compliance консалтинг",
    ],
    metrics: [
      { label: "аудит", value: "100%" },
    ],
  },
  {
    id: "analytics-growth",
    title: "Analytics & Growth",
    description: "Инструменты аналитики для Web3 проектов",
    icon: "analytics",
    image: "https://01.tech/images/home/solutions/cards/6/ru/bg_horizontal@2x.webp",
    features: [
      "On-chain аналитика",
      "Метрики пользователей",
      "Воронки конверсий",
      "A/B тестирование",
    ],
    metrics: [
      { label: "данные", value: "Real-time" },
    ],
  },
];
