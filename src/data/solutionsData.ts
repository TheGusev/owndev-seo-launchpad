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
  tags?: string[];
}

export const solutions: Solution[] = [
  {
    id: "one-messenger",
    title: "ONE Messenger",
    description: "Безопасный мессенджер с end-to-end шифрованием и интеграцией блокчейна",
    icon: "games",
    image: "https://01.tech/images/home/solutions/cards/1/ru/bg_horizontal@2x.webp",
    features: [
      "E2E шифрование по умолчанию",
      "Децентрализованное хранение данных",
      "Голосовые и видео звонки HD",
      "Интеграция с OWN Blockchain",
      "Мультиплатформенность (iOS, Android, Web)",
    ],
    metrics: [
      { value: "MVP", label: "в разработке" },
      { value: "Q2 2025", label: "планируемый запуск" },
    ],
    tags: ["Messenger", "Blockchain", "Security"],
  },
  {
    id: "own-blockchain",
    title: "OWN Blockchain",
    description: "Высокопроизводительный блокчейн для децентрализованных приложений",
    icon: "betting",
    image: "https://01.tech/images/home/solutions/cards/2/ru/bg_horizontal@2x.webp",
    features: [
      "Proof-of-Stake консенсус",
      "Smart contracts на Rust/Solidity",
      "Cross-chain мосты (Ethereum, BSC)",
      "Низкие комиссии (< $0.01)",
      "Пропускная способность 10,000+ TPS",
    ],
    metrics: [
      { value: "Testnet", label: "активен" },
      { value: "Q2 2025", label: "Mainnet запуск" },
    ],
    tags: ["Blockchain", "Web3", "DeFi"],
  },
  {
    id: "mvp-development",
    title: "Разработка MVP & SaaS",
    description: "Полный цикл разработки от идеи до продакшена за 4-12 недель",
    icon: "payment",
    image: "https://01.tech/images/home/solutions/cards/3/ru/bg_horizontal@2x.webp",
    features: [
      "Next.js + TypeScript + Tailwind",
      "Supabase / PostgreSQL / Redis",
      "AI интеграция (GPT, Claude, Gemini)",
      "Turbo MVT A/B тестирование",
      "CI/CD и мониторинг из коробки",
    ],
    metrics: [
      { value: "4-12 недель", label: "от идеи до запуска" },
      { value: "20+", label: "запущенных проектов" },
    ],
    tags: ["Development", "MVP", "SaaS"],
  },
  {
    id: "seo-analytics",
    title: "SEO & Сквозная Аналитика",
    description: "Рост органического трафика + AI Playbooks + Predictive Routing для конверсий",
    icon: "analytics",
    image: "https://01.tech/images/home/solutions/cards/4/ru/bg_horizontal@2x.webp",
    features: [
      "Технический аудит и оптимизация",
      "AI-powered контент-стратегия",
      "Сквозная аналитика (GA4, Яндекс.Метрика, Amplitude)",
      "Predictive Routing для лидов",
      "Turbo MVT для A/B/n тестирования",
    ],
    metrics: [
      { value: "3-6 месяцев", label: "до первых результатов" },
      { value: "150-300%", label: "рост трафика" },
    ],
    tags: ["SEO", "Analytics", "Growth"],
  },
  {
    id: "ai-integration",
    title: "AI Integration & Playbooks",
    description: "Внедрение AI в продукт: чат-боты, рекомендации, аналитика, автоматизация",
    icon: "affiliate",
    image: "https://01.tech/images/home/solutions/cards/5/ru/bg_horizontal@2x.webp",
    features: [
      "AI Playbooks для сценариев взаимодействия",
      "RAG (Retrieval-Augmented Generation)",
      "Тонкая настройка моделей (fine-tuning)",
      "Vector DB (Pinecone, Weaviate, Supabase pgvector)",
      "Мониторинг качества ответов AI",
    ],
    metrics: [
      { value: "70%+", label: "автоматизация запросов" },
      { value: "24/7", label: "поддержка без людей" },
    ],
    tags: ["AI", "Automation", "ChatBots"],
  },
  {
    id: "devops-infrastructure",
    title: "DevOps & Infrastructure",
    description: "Надёжная инфраструктура, CI/CD, мониторинг и масштабирование",
    icon: "aml",
    image: "https://01.tech/images/home/solutions/cards/6/ru/bg_horizontal@2x.webp",
    features: [
      "Docker + Kubernetes на продакшене",
      "GitHub Actions / GitLab CI",
      "Мониторинг (Grafana, Prometheus, Sentry)",
      "Автомасштабирование и балансировка нагрузки",
      "Backup и disaster recovery",
    ],
    metrics: [
      { value: "99.9%", label: "uptime SLA" },
      { value: "10-1000x", label: "готовность к масштабированию" },
    ],
    tags: ["DevOps", "Infrastructure", "Monitoring"],
  },
];
