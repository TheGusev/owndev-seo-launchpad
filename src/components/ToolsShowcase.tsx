import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, Code2, FileCode, Sparkles, Shield, Bot, Swords, ScanSearch, TrendingUp, Link2, BrainCircuit, PenTool } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  { icon: Search, name: "Проверка сайта", description: "SEO, Директ, конкуренты — полный отчёт", slug: "site-check" },
  { icon: Search, name: "LLM‑Friendly SEO Auditor", description: "SEO + LLM аудит страницы: двойной скор и чек‑лист", slug: "seo-auditor" },
  { icon: Swords, name: "Анализ конкурентов", description: "Сравнение SEO-метрик двух страниц", slug: "competitor-analysis" },
  { icon: ScanSearch, name: "Проверка индексации", description: "Meta robots, canonical, X-Robots-Tag", slug: "indexation-checker" },
  { icon: BrainCircuit, name: "Семантическое ядро", description: "AI-генерация кластеров ключей по интентам", slug: "semantic-core" },
  { icon: PenTool, name: "AI Генератор текстов", description: "SEO-тексты: meta, FAQ, описания услуг", slug: "ai-text-generator" },
  { icon: Sparkles, name: "pSEO Generator", description: "Структура GEO‑страниц для городов и ниш", slug: "pseo-generator" },
  { icon: Code2, name: "Schema.org генератор", description: "JSON‑LD разметка для LocalBusiness, FAQ и др.", slug: "schema-generator" },
  { icon: Bot, name: "LLM Prompt Helper", description: "Готовые промты для AI‑генерации SEO‑контента", slug: "llm-prompt-helper" },
  { icon: Shield, name: "Anti‑Duplicate Checker", description: "Проверка текста на шаблонность", slug: "anti-duplicate" },
  { icon: FileCode, name: "Файлы вебмастера", description: "Sitemap.xml + robots.txt генератор", slug: "webmaster-files" },
  { icon: Link2, name: "Внутренние ссылки", description: "Поиск битых ссылок и анализ перелинковки", slug: "internal-links" },
  { icon: TrendingUp, name: "Мониторинг позиций", description: "Ручной трекер позиций из GSC", slug: "position-monitor" },
];

const ToolsShowcase = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="tools-showcase" className="py-16 md:py-32 relative overflow-hidden md:min-h-screen snap-section">
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
            Бесплатные{" "}
            <span className="text-gradient">LLM + SEO инструменты</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            12 профессиональных инструментов для SEO и оптимизации под AI‑поиск
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <Link
                to={`/tools/${tool.slug}`}
                className="glass rounded-2xl p-5 flex flex-col h-full card-hover block border border-transparent hover:border-primary/30 transition-colors duration-200"
              >
                <div className="p-2.5 rounded-xl bg-card inline-block mb-3 self-start">
                  <tool.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{tool.name}</h3>
                <p className="text-muted-foreground text-sm mb-3 flex-1">{tool.description}</p>
                <span className="text-primary text-sm font-medium">Открыть →</span>
              </Link>
            </motion.div>
          ))}
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
