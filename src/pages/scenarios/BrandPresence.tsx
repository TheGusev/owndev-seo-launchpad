import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Megaphone, Search, MessageSquare, TrendingUp, ArrowRight, Radar, Users, Construction } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
    { "@type": "ListItem", position: 2, name: "Присутствие бренда в AI", item: "https://owndev.ru/scenario/brand-presence" },
  ],
};

const steps = [
  { icon: Search, title: "Введите бренд", desc: "Укажите название компании или продукта для проверки" },
  { icon: MessageSquare, title: "Проверьте упоминания", desc: "Система запросит AI-модели и найдёт упоминания вашего бренда" },
  { icon: Radar, title: "Оцените контекст", desc: "Узнайте, в каком контексте AI упоминает ваш бренд — позитивном, нейтральном или нет" },
  { icon: TrendingUp, title: "Улучшите присутствие", desc: "Получите рекомендации по усилению AI-цитируемости" },
];

const tools = [
  { name: "Brand Tracker", desc: "Проверка упоминаний бренда в AI-ответах", link: "/tools/brand-tracker", icon: Megaphone },
  { name: "Competitor Analysis", desc: "Сравнение присутствия с конкурентами", link: "/tools/competitor-analysis", icon: Users },
];

const BrandPresence = () => (
  <>
    <Helmet>
      <title>Присутствие бренда в AI — OWNDEV</title>
      <meta name="description" content="Узнайте, упоминают ли ChatGPT, Perplexity и другие AI-ассистенты ваш бренд. Анализ контекста и рекомендации по улучшению." />
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
    <Header />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400">
            <Megaphone className="w-3 h-3 mr-1" /> Сценарий 3
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Узнайте, упоминают ли AI-ассистенты ваш бренд
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Проверьте, как ChatGPT, Perplexity и Яндекс Нейро говорят о вашем бренде. Оцените контекст и улучшите AI-цитируемость.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/tools/brand-tracker">Проверить бренд <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </motion.div>

        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Как работает сценарий</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-sm">
                <span className="absolute top-3 right-3 text-xs text-muted-foreground font-mono">0{i + 1}</span>
                <s.icon className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Инструменты сценария</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((t, i) => (
              <Link key={i} to={t.link} className="group p-5 rounded-2xl bg-card/40 border border-border hover:border-emerald-500/40 backdrop-blur-sm transition-all">
                <div className="flex items-start gap-3">
                  <t.icon className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold group-hover:text-emerald-400 transition-colors">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-card/40 border border-dashed border-emerald-500/20 flex items-start gap-3">
            <Construction className="w-5 h-5 text-emerald-400/60 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">В разработке</p>
              <p className="text-xs text-muted-foreground/70">Мониторинг цитируемости бренда в реальном времени, отслеживание динамики упоминаний и автоматические уведомления об изменениях.</p>
            </div>
          </div>
        </section>

        <section className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <h2 className="text-xl font-bold font-serif mb-4">Что вы получите</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Карта присутствия</p>
              <p className="text-muted-foreground">Где и как AI-модели упоминают ваш бренд</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Анализ контекста</p>
              <p className="text-muted-foreground">Позитивный, нейтральный или негативный тон упоминаний</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Рекомендации</p>
              <p className="text-muted-foreground">Как усилить присутствие бренда в AI-ответах</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>
);

export default BrandPresence;
