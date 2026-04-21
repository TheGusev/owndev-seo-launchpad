import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, Code2, FileCode, Sparkles, Shield, Bot, Swords, ScanSearch, TrendingUp, Link2, BrainCircuit, PenTool, Trophy, ShoppingBag, LayoutDashboard, LayoutTemplate, Star } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  { icon: Search, name: "Проверка сайта", description: "SEO Score + LLM Score, конкуренты, 200+ ключей, экспорт — полный GEO‑аудит", slug: "site-check", flagship: true, accent: "primary" as const },
  { icon: LayoutTemplate, name: "Site Formula", description: "Архитектурный blueprint для service-сайта: структура, индексация, масштабирование", slug: "site-formula", external: true, customPath: "/site-formula", flagship: true, accent: "violet" as const },
  { icon: LayoutDashboard, name: "Полный аудит", description: "GEO + SEO + CRO в одном отчёте — технические проблемы, конверсионные барьеры, потери бюджета и стоимость исправления", slug: "full-audit", badge: "Новое", badge2: "Всё в одном" },
  { icon: ShoppingBag, name: "Аудит карточек WB / Ozon", description: "AI-аудит карточки маркетплейса: контент, поиск, конверсия и реклама", slug: "marketplace-audit", external: true },
  { icon: Search, name: "LLM‑Friendly SEO Auditor", description: "SEO + LLM аудит страницы: двойной скор и чек‑лист", slug: "seo-auditor" },
  { icon: Swords, name: "Анализ конкурентов", description: "Сравнение SEO-метрик двух страниц", slug: "competitor-analysis" },
  { icon: ScanSearch, name: "Проверка индексации", description: "Meta robots, canonical, X-Robots-Tag", slug: "indexation-checker" },
  { icon: BrainCircuit, name: "Семантическое ядро", description: "AI-генерация кластеров ключей по интентам", slug: "semantic-core" },
  { icon: PenTool, name: "AI Генератор текстов", description: "SEO-тексты: meta, FAQ, описания услуг", slug: "ai-text-generator" },
  { icon: Sparkles, name: "pSEO Generator", description: "Структура GEO‑страниц для городов и ниш", slug: "pseo-generator" },
  { icon: Code2, name: "Schema.org генератор", description: "JSON‑LD разметка для LocalBusiness, FAQ и др.", slug: "schema-generator" },
  { icon: Bot, name: "LLM Prompt Helper", description: "Готовые промты для AI‑генерации SEO‑контента", slug: "llm-prompt-helper" },
  { icon: Link2, name: "Внутренние ссылки", description: "Поиск битых ссылок и анализ перелинковки", slug: "internal-links" },
];

const ToolsShowcase = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="tools-showcase" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(217_91%_60%_/_0.05),transparent_50%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Инструменты{" "}
            <span className="text-gradient">GEO и AI‑ready аудита</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            15+ инструментов для SEO, AI‑видимости и конкурентного анализа
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {tools.map((tool, i) => {
            const href = (tool as any).customPath ? (tool as any).customPath : (tool as any).external ? `/${tool.slug}` : `/tools/${tool.slug}`;
            const isFlagship = (tool as any).flagship;
            const isViolet = (tool as any).accent === "violet";
            const flagshipBorder = isFlagship
              ? isViolet
                ? "border-violet-500/40 hover:border-violet-500/70"
                : "border-primary/40 hover:border-primary/70"
              : "border-transparent hover:border-primary/30";
            const flagshipGlow = isFlagship
              ? isViolet
                ? { boxShadow: "0 0 28px -14px hsl(270 80% 60% / 0.7)" }
                : { boxShadow: "0 0 28px -14px hsl(var(--primary) / 0.7)" }
              : undefined;
            const flagshipIconColor = isFlagship && isViolet ? "text-violet-400" : "text-primary";
            return (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <Link
                to={href}
                style={flagshipGlow}
                className={`glass rounded-2xl p-5 flex flex-col h-full card-hover block border transition-colors duration-200 ${flagshipBorder}`}
              >
                <div className="p-2.5 rounded-xl bg-card inline-block mb-3 self-start">
                  <tool.icon className={`w-4 h-4 ${flagshipIconColor}`} />
                </div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {isFlagship && <Trophy className={`w-3.5 h-3.5 ${flagshipIconColor} shrink-0`} />}
                  <h3 className="text-base font-bold">{tool.name}</h3>
                  {isFlagship && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${isViolet ? "bg-violet-500/15 text-violet-400" : "bg-primary/15 text-primary"}`}>
                      <Star className="w-2.5 h-2.5" /> Флагман
                    </span>
                  )}
                  {(tool as any).badge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wide">
                      {(tool as any).badge}
                    </span>
                  )}
                  {(tool as any).badge2 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold uppercase tracking-wide">
                      {(tool as any).badge2}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-3 flex-1">{tool.description}</p>
                <span className={`text-sm font-medium ${flagshipIconColor}`}>Открыть →</span>
              </Link>
            </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/tools" className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-primary font-semibold hover:border-primary/40 transition-colors">
            Все инструменты →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ToolsShowcase;
