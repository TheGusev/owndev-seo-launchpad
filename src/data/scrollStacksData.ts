import {
  Globe,
  TrendingDown,
  DollarSign,
  BarChart3,
  Coins,
  Shield,
  Zap,
  Bot,
  Building2,
  ShoppingCart,
  Search,
  Rocket,
  MessageSquare,
} from "lucide-react";

export interface ProblemCardData {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  status: string;
  statusColor: string;
  meta: string;
  tags: string[];
}

export interface ServiceCardData {
  title: string;
  goal: string;
  duration: string;
  price: string;
  audience: string;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
}

export const problemsData: ProblemCardData[] = [
  {
    title: "Сайт не приносит клиентов",
    description: "Старый дизайн, медленная загрузка, нет SEO. Посетители уходят через 3 секунды.",
    icon: Globe,
    iconColor: "text-blue-500",
    status: "Критично",
    statusColor: "bg-destructive/20 text-destructive",
    meta: "–80% трафика",
    tags: ["Дизайн", "SEO", "UX"],
  },
  {
    title: "Нет унификации в системе",
    description: "Каждый проект с нуля, нет масштабирования. Время разработки ×3.",
    icon: TrendingDown,
    iconColor: "text-amber-500",
    status: "Проблема",
    statusColor: "bg-warning/20 text-warning",
    meta: "×3 время",
    tags: ["Процессы", "Масштаб"],
  },
  {
    title: "Стоимость разработки 500K+",
    description: "Не окупается на малом/среднем бизнесе. ROI уходит в минус.",
    icon: DollarSign,
    iconColor: "text-red-500",
    status: "Дорого",
    statusColor: "bg-destructive/20 text-destructive",
    meta: "500K+ ₽",
    tags: ["Бюджет", "ROI"],
  },
  {
    title: "Нет аналитики и отчетов",
    description: "Не понять, работает ли сайт. Решения принимаются вслепую.",
    icon: BarChart3,
    iconColor: "text-purple-500",
    status: "Слепота",
    statusColor: "bg-secondary/20 text-secondary",
    meta: "0 метрик",
    tags: ["Аналитика"],
  },
];

export const solutionsData: ProblemCardData[] = [
  {
    title: "Низкие цены, высокий результат",
    description: "На 30% дешевле конкурентов. Гарантия роста 150% за 6 месяцев.",
    icon: Coins,
    iconColor: "text-emerald-500",
    status: "Выгодно",
    statusColor: "bg-success/20 text-success",
    meta: "–30% цена",
    tags: ["Экономия", "Гарантия"],
  },
  {
    title: "Комплексный подход",
    description: "Разработка + SEO + поддержка. Всё в одном месте.",
    icon: Shield,
    iconColor: "text-sky-500",
    status: "Всё включено",
    statusColor: "bg-accent/20 text-accent",
    meta: "3 в 1",
    tags: ["Разработка", "SEO"],
  },
  {
    title: "Прозрачное ценообразование",
    description: "Платите за клиентов, а не за красивый сайт. Фиксированные цены.",
    icon: Zap,
    iconColor: "text-yellow-500",
    status: "Честно",
    statusColor: "bg-warning/20 text-warning-foreground",
    meta: "0 сюрпризов",
    tags: ["Прозрачность"],
  },
  {
    title: "Собственные SaaS-платформы",
    description: "Встраиваем AI, аналитику, автоматизацию. Результат за неделю.",
    icon: Bot,
    iconColor: "text-violet-500",
    status: "AI-powered",
    statusColor: "bg-secondary/20 text-secondary",
    meta: "7 дней",
    tags: ["AI", "Автоматизация"],
  },
];

export const servicesData: ServiceCardData[] = [
  {
    title: "Landing Page / Лендинг",
    goal: "Продажи, лиды, регистрация",
    duration: "5 дней",
    price: "от 40,000 ₽",
    audience: "Стартапы, услуги, акции",
    icon: Globe,
    color: "primary",
  },
  {
    title: "Корпоративный сайт",
    goal: "Имидж, информация, контакты",
    duration: "2-3 недели",
    price: "от 90,000 ₽",
    audience: "Компании, агентства",
    icon: Building2,
    color: "accent",
  },
  {
    title: "Интернет-магазин",
    goal: "E-commerce, продажи товаров",
    duration: "3-4 недели",
    price: "от 120,000 ₽",
    audience: "Розница, товары",
    icon: ShoppingCart,
    color: "secondary",
  },
  {
    title: "SEO-оптимизация",
    goal: "Органический трафик",
    duration: "от 6 месяцев",
    price: "от 60,000 ₽/мес",
    audience: "B2B, услуги",
    icon: Search,
    color: "success",
  },
  {
    title: "SaaS-платформа",
    goal: "Масштабирование, recurring",
    duration: "2-3 месяца",
    price: "от 300,000 ₽",
    audience: "Салоны, клиники",
    icon: Rocket,
    color: "primary",
  },
  {
    title: "Консультация + Аудит",
    goal: "Понять, что нужно бизнесу",
    duration: "1-2 дня",
    price: "БЕСПЛАТНО",
    audience: "Все",
    icon: MessageSquare,
    color: "accent",
    highlight: true,
  },
];
