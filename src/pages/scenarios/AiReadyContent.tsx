import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileText, Layers, BookOpen, Code2, ArrowRight, Sparkles, PenTool, Braces } from "lucide-react";
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
    { "@type": "ListItem", position: 2, name: "AI-Ready контент", item: "https://owndev.ru/scenario/ai-ready-content" },
  ],
};

const steps = [
  { icon: Layers, title: "Соберите семантику", desc: "Сгенерируйте семантическое ядро с кластерами и частотностью" },
  { icon: FileText, title: "Сгенерируйте бриф", desc: "Получите структуру статьи с E-E-A-T сигналами и вопросами для FAQ" },
  { icon: PenTool, title: "Создайте контент", desc: "Напишите текст с AI-помощником или используйте готовую структуру" },
  { icon: Braces, title: "Добавьте Schema", desc: "Сгенерируйте JSON-LD разметку для лучшей интерпретации AI" },
];

const tools = [
  { name: "Content Brief Generator", desc: "Генерация структуры статьи с E-E-A-T", link: "/tools/content-brief", icon: FileText },
  { name: "Semantic Core Generator", desc: "Семантическое ядро с кластеризацией", link: "/tools/semantic-core", icon: Layers },
  { name: "Schema Generator", desc: "JSON-LD разметка для AI-поиска", link: "/tools/schema-generator", icon: Code2 },
  { name: "AI Text Generator", desc: "Генерация текстов с учётом SEO", link: "/tools/ai-text-generator", icon: Sparkles },
];

const AiReadyContent = () => (
  <>
    <Helmet>
      <title>AI-Ready контент — создайте контент для нейросетей — OWNDEV</title>
      <meta name="description" content="Создайте контент, который цитируют ChatGPT и Perplexity. Семантика, E-E-A-T структура, FAQ и JSON-LD разметка." />
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </Helmet>
    <Header />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-violet-500/30 text-violet-400">
            <FileText className="w-3 h-3 mr-1" /> Сценарий 2
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Создайте контент, который цитируют нейросети
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Структурированный контент с E-E-A-T сигналами, FAQ-блоками и Schema-разметкой — именно то, что ищут AI-модели.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/tools/content-brief">Создать контент-бриф <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </motion.div>

        <ScenarioDemoForm
          placeholder="Тема или ключевое слово"
          buttonText="Создать бриф"
          targetPath="/tools/content-brief"
          queryParam="topic"
          accentColor="violet"
          icon={FileText}
        />

        <section className="mb-16">
          <h2 className="text-xl font-bold font-serif text-center mb-8">Как работает сценарий</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative p-5 rounded-2xl bg-card/40 border border-border backdrop-blur-sm">
                <span className="absolute top-3 right-3 text-xs text-muted-foreground font-mono">0{i + 1}</span>
                <s.icon className="w-8 h-8 text-violet-400 mb-3" />
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
              <Link key={i} to={t.link} className="group p-5 rounded-2xl bg-card/40 border border-border hover:border-violet-500/40 backdrop-blur-sm transition-all">
                <div className="flex items-start gap-3">
                  <t.icon className="w-5 h-5 text-violet-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold group-hover:text-violet-400 transition-colors">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
          <h2 className="text-xl font-bold font-serif mb-4">Что вы получите</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">Контент-план</p>
              <p className="text-muted-foreground">Структура с заголовками, подтемами и E-E-A-T блоками</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">FAQ-секция</p>
              <p className="text-muted-foreground">Вопросы и ответы для попадания в AI-сниппеты</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40">
              <p className="font-semibold mb-1">JSON-LD разметка</p>
              <p className="text-muted-foreground">Готовая Schema для машинного понимания контента</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>
);

export default AiReadyContent;
