import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BarChart3, PlusCircle, Activity, Bell, ArrowRight, TrendingUp, Construction, LineChart } from "lucide-react";
import ScenarioDemoForm from "@/components/scenarios/ScenarioDemoForm";
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
    { "@type": "ListItem", position: 2, name: "Мониторинг GEO-позиций", item: "https://owndev.ru/scenario/monitoring" },
  ],
};

const steps = [
  { icon: PlusCircle, title: "Добавьте сайт", desc: "Укажите домен для регулярного отслеживания AI-видимости" },
  { icon: BarChart3, title: "Получите базовый скор", desc: "Первый замер SEO + LLM Score как точка отсчёта" },
  { icon: Activity, title: "Отслеживайте динамику", desc: "Еженедельные пересчёты показывают тренды видимости" },
  { icon: Bell, title: "Реагируйте на изменения", desc: "Замечайте просадки и рост — корректируйте стратегию" },
];

const tools = [
  { name: "GEO-рейтинг", desc: "Сравнительный рейтинг AI-видимости сайтов", link: "/geo-rating", icon: BarChart3 },
];

const Monitoring = () => (
  <>
    <Helmet>
      <title>Мониторинг GEO-позиций — OWNDEV</title>
      <meta name="description" content="Отслеживайте AI-видимость сайта еженедельно. Динамика SEO + LLM Score, сравнение с конкурентами и уведомления об изменениях." />
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
    <Header />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">
            <BarChart3 className="w-3 h-3 mr-1" /> Сценарий 4
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Отслеживайте AI-видимость еженедельно
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Регулярный мониторинг SEO Score и LLM Score. Замечайте изменения, сравнивайте с конкурентами и управляйте AI-видимостью.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/geo-rating">Открыть рейтинг <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </motion.div>

        <ScenarioDemoForm
          placeholder="https://ваш-сайт.ru"
          buttonText="Добавить в мониторинг"
          targetPath="/geo-rating"
          queryParam="url"
          accentColor="amber"
          icon={PlusCircle}
        />

        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Как работает сценарий</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-sm">
                <span className="absolute top-3 right-3 text-xs text-muted-foreground font-mono">0{i + 1}</span>
                <s.icon className="w-8 h-8 text-amber-400 mb-3" />
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
              <Link key={i} to={t.link} className="group p-5 rounded-2xl bg-card/40 border border-border hover:border-amber-500/40 backdrop-blur-sm transition-all">
                <div className="flex items-start gap-3">
                  <t.icon className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold group-hover:text-amber-400 transition-colors">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-card/40 border border-dashed border-amber-500/20 flex items-start gap-3">
            <Construction className="w-5 h-5 text-amber-400/60 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">В разработке</p>
              <p className="text-xs text-muted-foreground/70">Автоматические еженедельные проверки, история скоров с графиками, email-уведомления при значительных изменениях позиций.</p>
            </div>
          </div>
        </section>

        <section className="text-center p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
          <h2 className="text-xl font-bold font-serif mb-4">Что вы получите</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Динамика скоров</p>
              <p className="text-muted-foreground">SEO + LLM Score в динамике — тренды и аномалии</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Сравнение</p>
              <p className="text-muted-foreground">Ваш сайт vs конкуренты в GEO-рейтинге</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Уведомления</p>
              <p className="text-muted-foreground">Оповещения при значительных изменениях видимости</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>
);

export default Monitoring;
