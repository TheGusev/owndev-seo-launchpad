export interface SolutionMetric {
  label: string;
  value: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "message" | "blockchain" | "payment" | "code" | "aml" | "analytics";
  image: string;
  features: string[];
  metrics?: SolutionMetric[];
}

export const solutions: Solution[] = [
  {
    id: "one-messenger",
    title: "ONE Messenger",
    description: "Защищённый мессенджер нового поколения с фокусом на приватность",
    icon: "message",
    image: "",
    features: [
      "End-to-end шифрование",
      "Групповые чаты и каналы",
      "Голосовые и видеозвонки",
      "Push-уведомления в реальном времени",
    ],
    metrics: [
      { label: "статус", value: "MVP" },
      { label: "этап", value: "в разработке" },
    ],
  },
  {
    id: "own-blockchain",
    title: "OWN Blockchain",
    description: "Собственный блокчейн для экосистемы продуктов",
    icon: "blockchain",
    image: "",
    features: [
      "Консенсус Proof-of-Stake",
      "Смарт-контракты",
      "Cross-chain интеграции",
      "Высокая пропускная способность",
    ],
    metrics: [
      { label: "статус", value: "MVP" },
      { label: "этап", value: "в разработке" },
    ],
  },
  {
    id: "wallet-payments",
    title: "Wallet & Payments",
    description: "Кошелёк и платёжная инфраструктура для экосистемы",
    icon: "payment",
    image: "",
    features: [
      "Мультивалютные кошельки",
      "P2P переводы",
      "Фиат on/off-ramp",
      "Интеграция с OWN Blockchain",
    ],
    metrics: [{ label: "статус", value: "MVP" }],
  },
  {
    id: "developer-platform",
    title: "Developer Platform",
    description: "Инструменты и SDK для разработчиков экосистемы",
    icon: "code",
    image: "",
    features: [
      "SDK & REST API",
      "Подробная документация",
      "Sandbox-окружение",
      "CI/CD интеграции",
      "Webhooks и события",
    ],
  },
  {
    id: "security-compliance",
    title: "Security & Compliance",
    description: "Безопасность и соответствие регуляторным требованиям",
    icon: "aml",
    image: "",
    features: [
      "KYC/AML проверки",
      "Двухфакторная аутентификация",
      "Аудит смарт-контрактов",
      "Мониторинг угроз",
    ],
  },
  {
    id: "analytics-growth",
    title: "Analytics & Growth",
    description: "Аналитика и инструменты роста продукта",
    icon: "analytics",
    image: "",
    features: [
      "Real-time дашборды",
      "A/B тестирование",
      "ML-прогнозирование",
      "Когортный анализ",
    ],
    metrics: [{ label: "статус", value: "MVP" }],
  },
];
