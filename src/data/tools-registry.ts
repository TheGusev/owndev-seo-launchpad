import { type LucideIcon, Search, Users, ListChecks, Sparkles, Code2, Calculator, FileText, Bot, Shield, BarChart3, Bell, FileCode, FileType, Link2, MapPin, Download, MessageSquare } from "lucide-react";
import { lazy, type ComponentType } from "react";

export type ToolStatus = "active" | "coming_soon";

export interface ToolDef {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  category: string;
  icon: LucideIcon;
  component: React.LazyExoticComponent<ComponentType>;
  gradient: string;
  useCases: string[];
  geoEnabled: boolean;
  status: ToolStatus;
}

export const categories = [
  { id: "analysis", name: "Анализ и аудит", icon: Search },
  { id: "generation", name: "Генерация (pSEO)", icon: Sparkles },
  { id: "content", name: "Контент", icon: FileText },
  { id: "monitoring", name: "Мониторинг", icon: BarChart3 },
  { id: "webmaster", name: "Инструменты вебмастера", icon: FileCode },
  { id: "integrations", name: "Интеграции", icon: Link2 },
];

export const tools: ToolDef[] = [
  // Analysis
  {
    id: "seo-auditor", slug: "seo-auditor",
    name: "SEO-аудитор сайта",
    shortDesc: "Технический анализ страницы: мета-теги, заголовки, изображения, размер HTML",
    category: "analysis", icon: Search,
    component: lazy(() => import("@/components/tools/SEOAuditor")),
    gradient: "bg-gradient-to-br from-blue-950/40 to-indigo-950/40",
    useCases: ["Технический аудит перед запуском", "Поиск ошибок индексации", "Проверка Core Web Vitals"],
    geoEnabled: true, status: "active",
  },
  {
    id: "competitor-analysis", slug: "competitor-analysis",
    name: "Анализ конкурентов",
    shortDesc: "Сравнение ТОП-10 сниппетов и структуры конкурентов",
    category: "analysis", icon: Users,
    component: lazy(() => import("@/components/tools/CompetitorAnalysis")),
    gradient: "bg-gradient-to-br from-slate-950/40 to-blue-950/40",
    useCases: ["Анализ выдачи по запросу", "Сравнение сниппетов", "Поиск слабых мест конкурентов"],
    geoEnabled: true, status: "coming_soon",
  },
  {
    id: "indexation-checker", slug: "indexation-checker",
    name: "Проверка индексации",
    shortDesc: "Пакетная проверка URL в поисковых системах",
    category: "analysis", icon: ListChecks,
    component: lazy(() => import("@/components/tools/IndexationChecker")),
    gradient: "bg-gradient-to-br from-cyan-950/40 to-blue-950/40",
    useCases: ["Проверка новых страниц", "Мониторинг выпавших URL", "Аудит индексации после миграции"],
    geoEnabled: false, status: "coming_soon",
  },
  // Generation
  {
    id: "pseo-generator", slug: "pseo-generator",
    name: "pSEO Generator",
    shortDesc: "Генерация структуры GEO-страниц: slug, title, h1, meta, шаблон текста",
    category: "generation", icon: Sparkles,
    component: lazy(() => import("@/components/tools/PSEOGenerator")),
    gradient: "bg-gradient-to-br from-violet-950/40 to-purple-950/40",
    useCases: ["Старт нового pSEO-проекта", "Разработка структуры для копирайтеров", "Подготовка импорта в CMS"],
    geoEnabled: true, status: "active",
  },
  {
    id: "schema-generator", slug: "schema-generator",
    name: "Schema.org генератор",
    shortDesc: "JSON-LD разметка: LocalBusiness, Organization, Article, Product и др.",
    category: "generation", icon: Code2,
    component: lazy(() => import("@/components/tools/SchemaGenerator")),
    gradient: "bg-gradient-to-br from-emerald-950/40 to-teal-950/40",
    useCases: ["Разметка карточки компании", "Генерация FAQ-схемы", "Подготовка к Rich Results"],
    geoEnabled: true, status: "active",
  },
  {
    id: "roi-calculator", slug: "roi-calculator",
    name: "ROI Calculator",
    shortDesc: "Расчёт окупаемости: заявки, продажи, выручка, прибыль, ROI",
    category: "generation", icon: Calculator,
    component: lazy(() => import("@/components/tools/ROICalculatorTool")),
    gradient: "bg-gradient-to-br from-lime-950/40 to-green-950/40",
    useCases: ["Оценка бюджета проекта", "Прогноз трафика по регионам", "Презентация ROI клиенту"],
    geoEnabled: true, status: "active",
  },
  // Content
  {
    id: "semantic-core", slug: "semantic-core",
    name: "Семантическое ядро",
    shortDesc: "Сбор и кластеризация ключевых запросов по интентам",
    category: "content", icon: FileText,
    component: lazy(() => import("@/components/tools/SemanticCoreGenerator")),
    gradient: "bg-gradient-to-br from-amber-950/40 to-orange-950/40",
    useCases: ["Сбор семантики для нового проекта", "Кластеризация по интентам", "Оценка частотности"],
    geoEnabled: true, status: "coming_soon",
  },
  {
    id: "ai-text-generator", slug: "ai-text-generator",
    name: "AI-генератор текстов",
    shortDesc: "Уникальные вступления и FAQ для GEO-страниц через AI",
    category: "content", icon: Bot,
    component: lazy(() => import("@/components/tools/AITextGenerator")),
    gradient: "bg-gradient-to-br from-pink-950/40 to-rose-950/40",
    useCases: ["Генерация локальных вступлений", "Создание FAQ под регион", "Уникализация контента"],
    geoEnabled: true, status: "coming_soon",
  },
  {
    id: "anti-duplicate", slug: "anti-duplicate",
    name: "Anti-Duplicate Checker",
    shortDesc: "Проверка текста на шаблонность и риск деиндексации",
    category: "content", icon: Shield,
    component: lazy(() => import("@/components/tools/AntiDuplicateChecker")),
    gradient: "bg-gradient-to-br from-red-950/40 to-purple-950/40",
    useCases: ["Перед массовой загрузкой контента", "После генерации текстов нейросетью", "Аудит GEO-страниц"],
    geoEnabled: false, status: "coming_soon",
  },
  // Monitoring
  {
    id: "position-monitor", slug: "position-monitor",
    name: "Монитор позиций",
    shortDesc: "Отслеживание позиций по запросам в Яндексе и Google",
    category: "monitoring", icon: BarChart3,
    component: lazy(() => import("@/components/tools/PositionMonitor")),
    gradient: "bg-gradient-to-br from-sky-950/40 to-indigo-950/40",
    useCases: ["Ежедневный мониторинг позиций", "GEO-проверка из разных городов", "Отчёты для клиентов"],
    geoEnabled: false, status: "coming_soon",
  },
  {
    id: "change-alerts", slug: "change-alerts",
    name: "Алерты изменений",
    shortDesc: "Мониторинг конкурентов и технических изменений сайта",
    category: "monitoring", icon: Bell,
    component: lazy(() => import("@/components/tools/ChangeAlerts")),
    gradient: "bg-gradient-to-br from-yellow-950/40 to-amber-950/40",
    useCases: ["Отслеживание конкурентов", "Мониторинг robots.txt", "Уведомления о 404"],
    geoEnabled: false, status: "coming_soon",
  },
  // Webmaster
  {
    id: "sitemap-generator", slug: "sitemap-generator",
    name: "Генератор sitemap.xml",
    shortDesc: "Создание карты сайта из списка URL с копированием и скачиванием",
    category: "webmaster", icon: FileCode,
    component: lazy(() => import("@/components/tools/SitemapGenerator")),
    gradient: "bg-gradient-to-br from-teal-950/40 to-cyan-950/40",
    useCases: ["Создание sitemap для нового сайта", "Разбивка на части для больших сайтов", "GEO-sitemap"],
    geoEnabled: false, status: "active",
  },
  {
    id: "robots-generator", slug: "robots-generator",
    name: "Генератор robots.txt",
    shortDesc: "Конструктор директив для поисковых роботов",
    category: "webmaster", icon: FileType,
    component: lazy(() => import("@/components/tools/RobotsTxtGenerator")),
    gradient: "bg-gradient-to-br from-stone-950/40 to-zinc-950/40",
    useCases: ["Настройка блокировок", "Проверка валидности", "Подготовка к запуску"],
    geoEnabled: false, status: "active",
  },
  {
    id: "internal-links", slug: "internal-links",
    name: "Проверка перелинковки",
    shortDesc: "Визуализация внутренних ссылок и orphaned pages",
    category: "webmaster", icon: Link2,
    component: lazy(() => import("@/components/tools/InternalLinksChecker")),
    gradient: "bg-gradient-to-br from-violet-950/40 to-fuchsia-950/40",
    useCases: ["Поиск orphaned pages", "Анализ link juice", "Оптимизация перелинковки"],
    geoEnabled: false, status: "coming_soon",
  },
  {
    id: "ai-citation", slug: "ai-citation",
    name: "AI Citation Checker",
    shortDesc: "Готовность страницы к Perplexity, ChatGPT и AI-обзорам",
    category: "webmaster", icon: Bot,
    component: lazy(() => import("@/components/tools/AICitationChecker")),
    gradient: "bg-gradient-to-br from-teal-950/40 to-emerald-950/40",
    useCases: ["Подготовка контент-хабов под AI-трафик", "Обновление ключевых страниц"],
    geoEnabled: false, status: "coming_soon",
  },
  // Integrations
  {
    id: "geo-map", slug: "geo-map",
    name: "GEO Coverage Map",
    shortDesc: "Планирование охвата городов для pSEO-проекта",
    category: "integrations", icon: MapPin,
    component: lazy(() => import("@/components/tools/GEOCoverageMap")),
    gradient: "bg-gradient-to-br from-blue-950/40 to-cyan-950/40",
    useCases: ["Планирование охвата", "Выбор городов для проекта", "Оценка потенциала региона"],
    geoEnabled: false, status: "active",
  },
  {
    id: "csv-export", slug: "csv-export",
    name: "CSV/Excel экспорт",
    shortDesc: "Выгрузка данных проекта в CSV, Excel и JSON",
    category: "integrations", icon: Download,
    component: lazy(() => import("@/components/tools/CSVExport")),
    gradient: "bg-gradient-to-br from-green-950/40 to-emerald-950/40",
    useCases: ["Экспорт семантического ядра", "Выгрузка структуры страниц", "Отчёты для клиентов"],
    geoEnabled: false, status: "coming_soon",
  },
  {
    id: "telegram-bot", slug: "telegram-bot",
    name: "Telegram-бот",
    shortDesc: "Настройка уведомлений об ошибках и позициях в Telegram",
    category: "integrations", icon: MessageSquare,
    component: lazy(() => import("@/components/tools/TelegramBotSetup")),
    gradient: "bg-gradient-to-br from-blue-950/40 to-sky-950/40",
    useCases: ["Уведомления об ошибках", "Отчёты о позициях", "Алерты по конкурентам"],
    geoEnabled: false, status: "coming_soon",
  },
];

export const getToolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const getToolsByCategory = (categoryId: string) => tools.filter((t) => t.category === categoryId);
export const getGeoEnabledTools = () => tools.filter((t) => t.geoEnabled);
