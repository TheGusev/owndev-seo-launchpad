import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileCheck, Star, Code2, Brain, BookOpen, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/ui/gradient-button";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
    { "@type": "ListItem", position: 2, name: "GEO-аудит", item: "https://owndev.ru/geo-audit" },
  ],
};

const softwareAppLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OWNDEV GEO-аудит",
  description: "Первый в Рунете GEO и AI-ready аудит сайта",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Чем GEO отличается от SEO?",
      acceptedAnswer: { "@type": "Answer", text: "SEO оптимизирует сайт для поисковых алгоритмов Яндекса и Google. GEO оптимизирует для AI-моделей — ChatGPT, Яндекс Нейро, Perplexity. Сейчас нужны оба подхода." },
    },
    {
      "@type": "Question",
      name: "Почему мой сайт не попадает в ответы ChatGPT?",
      acceptedAnswer: { "@type": "Answer", text: "Обычно это 3 причины: нет llms.txt, слабые E-E-A-T сигналы (нет авторов, нет Schema), и контент не структурирован под вопросно-ответный формат. GEO-аудит OWNDEV покажет все проблемы за 60 секунд." },
    },
    {
      "@type": "Question",
      name: "Это бесплатно?",
      acceptedAnswer: { "@type": "Answer", text: "Да. Полный GEO-аудит с LLM Score и планом исправления — бесплатно, без регистрации." },
    },
    {
      "@type": "Question",
      name: "Что такое LLM Score?",
      acceptedAnswer: { "@type": "Answer", text: "Оценка от 0 до 100 — насколько сайт готов к попаданию в ответы нейросетей. Первая метрика такого рода в Рунете." },
    },
  ],
};

const features = [
  { icon: FileCheck, title: "llms.txt", desc: "Проверяем и генерируем llms.txt и llms-full.txt — стандарт для AI-краулеров ChatGPT, Claude и Perplexity" },
  { icon: Star, title: "E-E-A-T сигналы", desc: "Проверяем экспертность, авторитетность и надёжность — ключевые факторы попадания в AI-ответы" },
  { icon: Code2, title: "Schema.org разметка", desc: "Анализируем структурированные данные — JSON-LD, которые нейросети используют для понимания сайта" },
  { icon: Brain, title: "LLM Score", desc: "Единая оценка AI-готовности от 0 до 100 — понятно и сразу" },
  { icon: BookOpen, title: "Структура контента", desc: "Проверяем заголовки, объём, FAQ, цены, отзывы — всё что AI учитывает при формировании ответа" },
  { icon: Sparkles, title: "AI-рекомендации", desc: "Конкретный план: что изменить, чтобы сайт попал в ответы нейросетей" },
];

const comparisonRows = [
  { aspect: "Цель", seo: "Попасть в топ поиска", geo: "Попасть в ответы AI" },
  { aspect: "Алгоритм", seo: "PageRank, ссылки, мета", geo: "LLM-обработка текста" },
  { aspect: "Ключевые факторы", seo: "Keywords, backlinks", geo: "E-E-A-T, Schema, llms.txt" },
  { aspect: "Инструменты", seo: "PR-CY, Pixel Tools", geo: "OWNDEV" },
  { aspect: "Тренд", seo: "Зрелый рынок", geo: "🔥 Быстрый рост 2025–2026" },
];

const steps = [
  { num: "01", title: "Вводите URL", desc: "Просто вставьте адрес сайта. Регистрация не нужна." },
  { num: "02", title: "AI анализирует", desc: "Gemini проверяет 20+ GEO и SEO параметров параллельно — результат через 60 секунд." },
  { num: "03", title: "Получаете отчёт", desc: "SEO Score + LLM Score, план исправления, ключи, конкуренты и экспорт." },
];

const faqs = [
  { q: "Чем GEO отличается от SEO?", a: "SEO оптимизирует сайт для поисковых алгоритмов Яндекса и Google. GEO оптимизирует для AI-моделей — ChatGPT, Яндекс Нейро, Perplexity. Сейчас нужны оба подхода." },
  { q: "Почему мой сайт не попадает в ответы ChatGPT?", a: "Обычно это 3 причины: нет llms.txt, слабые E-E-A-T сигналы (нет авторов, нет Schema), и контент не структурирован под вопросно-ответный формат. GEO-аудит OWNDEV покажет все проблемы за 60 секунд." },
  { q: "Это бесплатно?", a: "Да. Полный GEO-аудит с LLM Score и планом исправления — бесплатно, без регистрации." },
  { q: "Что такое LLM Score?", a: "Оценка от 0 до 100 — насколько сайт готов к попаданию в ответы нейросетей. Первая метрика такого рода в Рунете." },
];

const GeoAudit = () => {
  return (
    <>
      <Helmet>
        <title>GEO-аудит сайта — проверка AI-готовности онлайн | OWNDEV</title>
        <meta name="description" content="Бесплатный GEO-аудит сайта. Проверяем готовность к AI-выдаче ChatGPT, Яндекс Нейро и Perplexity. LLM Score + SEO Score в одном отчёте. Без регистрации." />
        <link rel="canonical" href="https://owndev.ru/geo-audit" />
        <meta property="og:title" content="GEO-аудит сайта — проверка AI-готовности онлайн | OWNDEV" />
        <meta property="og:description" content="Бесплатный GEO-аудит сайта. LLM Score + SEO Score в одном отчёте. Без регистрации." />
        <meta property="og:url" content="https://owndev.ru/geo-audit" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareAppLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(222_47%_15%),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10 text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              Новый стандарт SEO в Рунете
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6">
              GEO-аудит сайта — <span className="text-gradient">проверьте AI-готовность</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              GEO (Generative Engine Optimization) — это оптимизация не только для Яндекса и Google,
              но и для ChatGPT, Яндекс Нейро и Perplexity. Проверьте сайт прямо сейчас — бесплатно.
            </p>
            <GradientButton asChild size="lg">
              <Link to="/tools/site-check">Запустить GEO-аудит →</Link>
            </GradientButton>
          </div>
        </section>

        {/* Что такое GEO */}
        <section className="py-16 md:py-20 relative">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-8 text-center">
              Что такое <span className="text-gradient">GEO</span>?
            </h2>
            <div className="glass rounded-2xl p-8 space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                GEO — Generative Engine Optimization — новая дисциплина оптимизации сайтов для эпохи нейросетей.
                Если классический SEO помогает попасть в топ Яндекса и Google, то GEO помогает попасть в ответы
                AI-ассистентов: ChatGPT, Яндекс Нейро и Perplexity.
              </p>
              <p>
                По данным 2025 года, AI-ответы получают всё больший трафик за счёт традиционного поиска.
                Сайты без GEO-оптимизации теряют видимость — даже при хорошей SEO-позиции.
              </p>
            </div>
          </div>
        </section>

        {/* Что включает GEO-аудит */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-center">
              Что включает <span className="text-gradient">GEO-аудит</span> от OWNDEV
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              6 направлений проверки AI-готовности вашего сайта
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((f) => (
                <div key={f.title} className="relative group">
                  <GlowingEffect theme="accent" disabled={false} borderWidth={1} spread={20} glow blur={6} />
                  <div className="glass rounded-xl p-6 relative z-10 h-full">
                    <f.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GEO vs SEO */}
        <section className="py-16 md:py-20">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-8 text-center">
              GEO vs классический SEO — <span className="text-gradient">в чём разница?</span>
            </h2>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 font-semibold text-muted-foreground">Аспект</th>
                      <th className="text-left p-4 font-semibold text-muted-foreground">SEO</th>
                      <th className="text-left p-4 font-semibold text-primary">GEO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.aspect} className="border-b border-white/5 last:border-0">
                        <td className="p-4 font-medium">{row.aspect}</td>
                        <td className="p-4 text-muted-foreground">{row.seo}</td>
                        <td className="p-4 text-foreground">{row.geo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Как работает */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(222_47%_12%),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-12 text-center">
              Как работает <span className="text-gradient">аудит</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.num} className="text-center">
                  <span className="text-5xl font-bold text-primary/20 font-serif">{s.num}</span>
                  <h3 className="text-xl font-semibold mt-2 mb-3">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-8 text-center">
              Вопросы и <span className="text-gradient">ответы</span>
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="relative group">
                  <GlowingEffect theme="accent" disabled={false} borderWidth={1} spread={20} glow blur={6} />
                  <AccordionItem value={`faq-${i}`} className="glass rounded-xl px-6 border-none relative z-10">
                    <AccordionTrigger className="text-left hover:no-underline py-6">
                      <span className="font-semibold text-foreground">{faq.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">{faq.a}</AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_15%),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">
              Проверьте <span className="text-gradient">GEO-готовность</span> вашего сайта
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Бесплатный аудит — без регистрации — 60 секунд
            </p>
            <GradientButton asChild size="lg">
              <Link to="/tools/site-check">Запустить GEO-аудит →</Link>
            </GradientButton>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default GeoAudit;
