import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Eye, Search, AlertTriangle, CheckCircle, BarChart3, FileCheck, BrainCircuit, Activity } from "lucide-react";
import ScenarioDemoForm from "@/components/scenarios/ScenarioDemoForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
    { "@type": "ListItem", position: 2, name: "Аудит AI-видимости", item: "https://owndev.ru/scenario/ai-visibility" },
  ],
};

const steps = [
  { icon: Search, title: "Запустите аудит", desc: "Введите URL — система проверит сайт по 50+ критериям SEO и AI-видимости" },
  { icon: BarChart3, title: "Получите двойной скор", desc: "SEO Score + LLM Score — два показателя вместо одного для полной картины" },
  { icon: AlertTriangle, title: "Изучите проблемы", desc: "Каждая проблема с приоритетом (P1–P3), уверенностью и источником данных" },
  { icon: CheckCircle, title: "Исправьте по приоритетам", desc: "Начните с P1-блокеров — они больше всего влияют на видимость в AI" },
];

const tools = [
  { name: "Проверка сайта", desc: "Полный GEO-аудит с SEO + LLM Score", link: "/tools/site-check", icon: FileCheck },
  { name: "SEO Auditor", desc: "Детальный технический аудит", link: "/tools/seo-auditor", icon: Search },
  { name: "GEO-аудит", desc: "Специализированная проверка AI-ready", link: "/geo-audit", icon: BrainCircuit },
  { name: "GEO-рейтинг", desc: "Сравнение с конкурентами по AI-видимости", link: "/geo-rating", icon: Activity },
];

const AiVisibility = () => (
  <>
    <Helmet>
      <title>Аудит AI-видимости сайта — OWNDEV</title>
      <meta name="description" content="Узнайте, видит ли ваш сайт ChatGPT, Perplexity и Яндекс Нейро. Двойной скор SEO + LLM, приоритизированные проблемы и план действий." />
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
    <Header />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-cyan-500/30 text-cyan-400">
            <Eye className="w-3 h-3 mr-1" /> Сценарий 1
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Узнайте, видит ли ваш сайт AI-поиск
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Проверьте, как ChatGPT, Perplexity и Яндекс Нейро воспринимают ваш сайт. Получите SEO Score, LLM Score и конкретный план исправлений.
          </p>
        </motion.div>

        <ScenarioDemoForm
          placeholder="https://ваш-сайт.ru"
          buttonText="Запустить аудит"
          targetPath="/tools/site-check"
          queryParam="url"
          accentColor="cyan"
          icon={Search}
        />

        {/* Steps */}
        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Как работает сценарий</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-sm"
              >
                <span className="absolute top-3 right-3 text-xs text-muted-foreground font-mono">0{i + 1}</span>
                <s.icon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Инструменты сценария</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((t, i) => (
              <Link key={i} to={t.link} className="group p-5 rounded-2xl bg-card/40 border border-border hover:border-cyan-500/40 backdrop-blur-sm transition-all">
                <div className="flex items-start gap-3">
                  <t.icon className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold group-hover:text-cyan-400 transition-colors">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Result */}
        <section className="text-center p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
          <h2 className="text-xl font-bold font-serif mb-4">Что вы получите</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Двойной скор</p>
              <p className="text-muted-foreground">SEO Score + LLM Score для полной картины видимости</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Список P1-проблем</p>
              <p className="text-muted-foreground">Критические блокеры с приоритетами и уверенностью</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">План действий</p>
              <p className="text-muted-foreground">Пошаговые рекомендации по исправлению</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>
);

export default AiVisibility;
