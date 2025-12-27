export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: "web" | "mobile" | "automation" | "ai" | "cloud" | "consulting";
  image?: string;
}

export const solutions: Solution[] = [
  {
    id: "web",
    title: "Веб-разработка",
    description: "Современные веб-приложения на React, Vue, Next.js с высокой производительностью и отличным UX",
    icon: "web",
  },
  {
    id: "mobile",
    title: "Мобильные приложения",
    description: "Нативные и кроссплатформенные iOS и Android приложения с современным дизайном",
    icon: "mobile",
  },
  {
    id: "automation",
    title: "Автоматизация",
    description: "Оптимизация бизнес-процессов, интеграция систем и автоматизация рутинных задач",
    icon: "automation",
  },
  {
    id: "ai",
    title: "AI решения",
    description: "Интеграция искусственного интеллекта, машинное обучение и обработка данных",
    icon: "ai",
  },
  {
    id: "cloud",
    title: "Облачные сервисы",
    description: "Проектирование инфраструктуры, DevOps практики и миграция в облако",
    icon: "cloud",
  },
  {
    id: "consulting",
    title: "Консалтинг",
    description: "Технический аудит, стратегия развития и архитектурные решения",
    icon: "consulting",
  },
];
