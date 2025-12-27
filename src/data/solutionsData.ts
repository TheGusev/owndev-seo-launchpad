export interface SolutionMetric {
  label: string;
  value: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "mvp" | "security" | "blockchain" | "analytics" | "ai" | "devops";
  image: string;
  features: string[];
  metrics?: SolutionMetric[];
  tags?: string[];
}

export const solutions: Solution[] = [
  {
    id: "mvp-web-development",
    title: "Разработка MVP & Web приложений",
    description:
      "Полный цикл разработки от идеи до продакшена за 4-12 недель. Next.js, TypeScript, современный стек.",
    icon: "mvp",
    image: "https://01.tech/images/home/solutions/cards/3/ru/bg_horizontal@2x.webp",
    features: [
      "Next.js + TypeScript + Tailwind CSS",
      "Responsive design и адаптивная вёрстка",
      "Supabase / PostgreSQL / Redis",
      "RESTful API и GraphQL",
      "CI/CD и автоматический деплой",
    ],
    metrics: [
      { value: "4-12 недель", label: "от идеи до запуска" },
      { value: "20+", label: "запущенных проектов" },
    ],
    tags: ["Development", "MVP", "Web"],
  },
  {
    id: "secure-communications",
    title: "E2E шифрование и защищённые коммуникации",
    description:
      "Разработка чатов, мессенджеров и real-time коммуникаций с end-to-end шифрованием.",
    icon: "security",
    image: "https://01.tech/images/home/solutions/cards/1/ru/bg_horizontal@2x.webp",
    features: [
      "End-to-End шифрование (Signal Protocol, libsodium)",
      "WebSocket и real-time обмен сообщениями",
      "Голосовые и видео звонки (WebRTC)",
      "Децентрализованное хранение (IPFS, P2P)",
      "Мультиплатформенность (iOS, Android, Web, Desktop)",
    ],
    metrics: [
      { value: "E2E", label: "шифрование по умолчанию" },
      { value: "<100ms", label: "задержка сообщений" },
    ],
    tags: ["Security", "Real-time", "Encryption"],
  },
  {
    id: "blockchain-web3",
    title: "Blockchain & Web3 интеграция",
    description:
      "Интеграция смарт-контрактов, DeFi, NFT и Web3 в ваш продукт. Ethereum, Polygon, BSC, Solana.",
    icon: "blockchain",
    image: "https://01.tech/images/home/solutions/cards/2/ru/bg_horizontal@2x.webp",
    features: [
      "Разработка смарт-контрактов (Solidity, Rust)",
      "Интеграция Web3 кошельков (MetaMask, WalletConnect)",
      "DeFi протоколы (стейкинг, lending, swap)",
      "NFT marketplace и mint функционал",
      "Cross-chain мосты и мультичейн поддержка",
    ],
    metrics: [
      { value: "5+", label: "блокчейн-сетей" },
      { value: "Audit", label: "безопасность контрактов" },
    ],
    tags: ["Blockchain", "Web3", "DeFi", "NFT"],
  },
  {
    id: "seo-analytics",
    title: "SEO & Сквозная Аналитика",
    description:
      "Рост органического трафика + AI Playbooks + Predictive Routing + Turbo MVT для конверсий.",
    icon: "analytics",
    image: "https://01.tech/images/home/solutions/cards/4/ru/bg_horizontal@2x.webp",
    features: [
      "Технический SEO аудит и оптимизация",
      "AI-powered контент-стратегия и семантическое ядро",
      "Сквозная аналитика (GA4, Яндекс.Метрика, Amplitude)",
      "Predictive Routing для лидов",
      "Turbo MVT A-F тестирование для роста конверсий",
    ],
    metrics: [
      { value: "3-6 месяцев", label: "до первых результатов" },
      { value: "150-300%", label: "рост трафика" },
    ],
    tags: ["SEO", "Analytics", "Growth", "MVT"],
  },
  {
    id: "ai-integration",
    title: "AI Integration & Playbooks",
    description:
      "Внедрение AI в продукт: чат-боты, рекомендации, AI Playbooks, аналитика и автоматизация.",
    icon: "ai",
    image: "https://01.tech/images/home/solutions/cards/5/ru/bg_horizontal@2x.webp",
    features: [
      "AI Playbooks для сценариев взаимодействия",
      "RAG (Retrieval-Augmented Generation) для знаний",
      "Тонкая настройка моделей (fine-tuning GPT, Claude)",
      "Vector DB (Pinecone, Weaviate, Supabase pgvector)",
      "Мониторинг качества и A/B тестирование AI-ответов",
    ],
    metrics: [
      { value: "70%+", label: "автоматизация запросов" },
      { value: "24/7", label: "поддержка без людей" },
    ],
    tags: ["AI", "Automation", "ChatBots", "RAG"],
  },
  {
    id: "devops-infrastructure",
    title: "DevOps & Infrastructure",
    description:
      "Надёжная инфраструктура, CI/CD, мониторинг и масштабирование. 99.9% uptime SLA.",
    icon: "devops",
    image: "https://01.tech/images/home/solutions/cards/6/ru/bg_horizontal@2x.webp",
    features: [
      "Docker + Kubernetes на продакшене",
      "GitHub Actions / GitLab CI автоматизация",
      "Мониторинг (Grafana, Prometheus, Sentry)",
      "Автомасштабирование и балансировка нагрузки",
      "Backup, disaster recovery и security hardening",
    ],
    metrics: [
      { value: "99.9%", label: "uptime SLA" },
      { value: "10-1000x", label: "масштабирование" },
    ],
    tags: ["DevOps", "Infrastructure", "Monitoring", "CI/CD"],
  },
];
