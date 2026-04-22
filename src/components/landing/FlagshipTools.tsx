import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Search, LayoutTemplate, ShoppingBag, ArrowRight } from "lucide-react";
import { GeometricRays } from "@/components/ui/geometric-rays";

const flagships = [
  {
    title: "Site Check",
    badge: "Флагман",
    desc: "GEO + AI-ready аудит сайта за 2 минуты. SEO Score и LLM Score в одном отчёте.",
    cta: "Запустить аудит",
    href: "/tools/site-check",
    icon: Search,
    accent: {
      border: "border-cyan-500/30 hover:border-cyan-500/60",
      glow: "hover:shadow-[0_0_40px_hsl(190_80%_50%/0.2)]",
      iconBg: "bg-cyan-500/10",
      iconText: "text-cyan-400",
      badge: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
  },
  {
    title: "Site Formula",
    badge: "Флагман",
    desc: "Архитектурный blueprint сайта: структура страниц, блоки, приоритеты под вашу нишу.",
    cta: "Собрать blueprint",
    href: "/site-formula",
    icon: LayoutTemplate,
    accent: {
      border: "border-violet-500/30 hover:border-violet-500/60",
      glow: "hover:shadow-[0_0_40px_hsl(270_80%_60%/0.2)]",
      iconBg: "bg-violet-500/10",
      iconText: "text-violet-400",
      badge: "border-violet-500/30 text-violet-400 bg-violet-500/10",
    },
  },
  {
    title: "Marketplace Audit",
    badge: "Флагман",
    desc: "Аудит карточек Wildberries и Ozon: контент, поиск, конверсия, готовность к рекламе.",
    cta: "Проверить карточку",
    href: "/marketplace-audit",
    icon: ShoppingBag,
    accent: {
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      glow: "hover:shadow-[0_0_40px_hsl(155_80%_45%/0.2)]",
      iconBg: "bg-emerald-500/10",
      iconText: "text-emerald-400",
      badge: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
  },
];

const FlagshipTools = () => {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Флагманские инструменты OWNDEV",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: flagships.length,
    itemListElement: flagships.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://owndev.ru${t.href}`,
      item: {
        "@type": "SoftwareApplication",
        name: t.title,
        description: t.desc,
        url: `https://owndev.ru${t.href}`,
        applicationCategory: "SEOApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
      },
    })),
  };

  return (
    <section
      id="flagship-tools"
      aria-labelledby="flagship-heading"
      className="py-16 md:py-20 relative overflow-hidden"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
      </Helmet>
      <GeometricRays className="z-0 opacity-50" opacity={0.25} />
      <div className="container px-4 md:px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-12">
          <h2 id="flagship-heading" className="text-2xl md:text-4xl font-bold font-serif mb-3">
            С чего начать
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Три флагманских инструмента OWNDEV — выберите задачу и получите результат за пару минут.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {flagships.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={tool.href}
                  aria-label={`${tool.title} — ${tool.cta}`}
                  className={`group relative flex flex-col h-full p-6 rounded-2xl bg-card/40 backdrop-blur-sm border transition-all duration-300 ${tool.accent.border} ${tool.accent.glow}`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-3 rounded-xl ${tool.accent.iconBg}`}>
                      <Icon className={`w-6 h-6 ${tool.accent.iconText}`} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${tool.accent.badge}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-serif mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">{tool.desc}</p>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${tool.accent.iconText} group-hover:gap-3 transition-all`}>
                    {tool.cta}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlagshipTools;