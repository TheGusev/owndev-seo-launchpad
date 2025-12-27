export interface SolutionMetric {
  label: string;
  value: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "web" | "mobile" | "automation" | "ai" | "cloud" | "consulting";
  image?: string;
  features: string[];
  metrics: SolutionMetric[];
}

export const solutions: Solution[] = [
  {
    id: "web",
    title: "Веб-разработка",
    description: "Современные веб-приложения на React, Vue, Next.js с высокой производительностью и отличным UX",
    icon: "web",
    features: ["React / Vue / Next.js", "TypeScript", "Высокая производительность", "SEO оптимизация"],
    metrics: [
      { label: "Проектов", value: "50+" },
      { label: "Uptime", value: "99.9%" },
    ],
  },
  {
    id: "mobile",
    title: "Мобильные приложения",
    description: "Нативные и кроссплатформенные iOS и Android приложения с современным дизайном",
    icon: "mobile",
    features: ["React Native", "Flutter", "Swift / Kotlin", "Офлайн-режим"],
    metrics: [
      { label: "Загрузок", value: "1M+" },
      { label: "Рейтинг", value: "4.8★" },
    ],
  },
  {
    id: "automation",
    title: "Автоматизация",
    description: "Оптимизация бизнес-процессов, интеграция систем и автоматизация рутинных задач",
    icon: "automation",
    features: ["API интеграции", "Workflow автоматизация", "CRM/ERP связки", "Боты и скрипты"],
    metrics: [
      { label: "Экономия времени", value: "40%" },
      { label: "Интеграций", value: "100+" },
    ],
  },
  {
    id: "ai",
    title: "AI решения",
    description: "Интеграция искусственного интеллекта, машинное обучение и обработка данных",
    icon: "ai",
    features: ["LLM интеграции", "Computer Vision", "NLP / Чат-боты", "Предиктивная аналитика"],
    metrics: [
      { label: "Точность моделей", value: "95%" },
      { label: "Обработано данных", value: "10TB+" },
    ],
  },
  {
    id: "cloud",
    title: "Облачные сервисы",
    description: "Проектирование инфраструктуры, DevOps практики и миграция в облако",
    icon: "cloud",
    features: ["AWS / GCP / Azure", "Kubernetes", "CI/CD пайплайны", "Мониторинг"],
    metrics: [
      { label: "Серверов", value: "500+" },
      { label: "Доступность", value: "99.99%" },
    ],
  },
  {
    id: "consulting",
    title: "Консалтинг",
    description: "Технический аудит, стратегия развития и архитектурные решения",
    icon: "consulting",
    features: ["Технический аудит", "Архитектура систем", "Code Review", "Стратегия развития"],
    metrics: [
      { label: "Клиентов", value: "200+" },
      { label: "Лет опыта", value: "10+" },
    ],
  },
];
