import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { FileCheck, Star, Code2, Brain, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { motion } from "framer-motion";
import { useState } from "react";
import { saveLastUrl } from "@/utils/lastUrl";
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
    { "@type": "Question", name: "Чем GEO отличается от SEO?", acceptedAnswer: { "@type": "Answer", text: "SEO оптимизирует сайт для поисковых алгоритмов. GEO оптимизирует для AI-моделей — ChatGPT, Яндекс Нейро, Perplexity." } },
    { "@type": "Question", name: "Почему мой сайт не попадает в ответы ChatGPT?", acceptedAnswer: { "@type": "Answer", text: "Нет llms.txt, слабые E-E-A-T сигналы, контент не структурирован. GEO-аудит покажет проблемы." } },
    { "@type": "Question", name: "Это бесплатно?", acceptedAnswer: { "@type": "Answer", text: "Да. Полный GEO-аудит с LLM Score — бесплатно, без регистрации." } },
    { "@type": "Question", name: "Что такое LLM Score?", acceptedAnswer: { "@type": "Answer", text: "Оценка от 0 до 100 — насколько сайт готов к попаданию в ответы нейросетей." } },
  ],
};

const stats = [
  { value: "73%", label: "сайтов не готовы к AI-выдаче" },
  { value: "4x", label: "больше трафика у AI-visible сайтов" },
  { value: "+20", label: "баллов даёт один llms.txt" },
];

const evolution = [
  { icon: "📊", title: "SEO (было)", desc: "Оптимизация для Яндекса и Google. Ключевые слова, ссылки, техническое SEO." },
  { icon: "🤖", title: "AI-поиск (сейчас)", desc: "ChatGPT, Perplexity, Яндекс Нейро — пользователи получают готовые ответы. Цитируемые сайты выигрывают.", pulse: true },
  { icon: "🚀", title: "GEO (ответ)", desc: "Generative Engine Optimization — оптимизация под AI-выдачу. Новая обязательная дисциплина." },
];

const auditCards = [
  { icon: FileCheck, title: "llms.txt", desc: "Файл-инструкция для AI-краулеров. Без него ChatGPT и Perplexity обходят ваш сайт по умолчанию.", weight: "+20 LLM Score" },
  { icon: Star, title: "E-E-A-T сигналы", desc: "Экспертность, авторитетность, доверие — главные факторы для Google и нейросетей.", weight: "+15 LLM Score" },
  { icon: Code2, title: "Schema.org / FAQPage", desc: "Структурированные данные помогают нейросетям понять контент и использовать в ответах.", weight: "+15 LLM Score" },
  { icon: BookOpen, title: "Структура контента", desc: "H1/H2, объём текста, логичность — нейросети извлекают факты из хорошо структурированных страниц.", weight: "+20 LLM Score" },
  { icon: Sparkles, title: "Технические AI-сигналы", desc: "og:image, lang, canonical, скорость — базовые сигналы достоверности для AI-краулеров.", weight: "+15 LLM Score" },
  { icon: Brain, title: "Direct Score", desc: "Готовность к рекламе в Яндекс.Директ: ключи, минус-слова, конкуренты.", weight: "Отдельная метрика" },
];

const faqs = [
  { q: "Чем GEO отличается от SEO?", a: "SEO оптимизирует сайт для поисковых алгоритмов Яндекса и Google. GEO оптимизирует для AI-моделей — ChatGPT, Яндекс Нейро, Perplexity. Сейчас нужны оба подхода." },
  { q: "Почему мой сайт не попадает в ответы ChatGPT?", a: "Обычно это 3 причины: нет llms.txt, слабые E-E-A-T сигналы (нет авторов, нет Schema), и контент не структурирован под вопросно-ответный формат. GEO-аудит OWNDEV покажет все проблемы за 60 секунд." },
  { q: "Это бесплатно?", a: "Да. Полный GEO-аудит с LLM Score и планом исправления — бесплатно, без регистрации." },
  { q: "Что такое LLM Score?", a: "Оценка от 0 до 100 — насколько сайт готов к попаданию в ответы нейросетей. Первая метрика такого рода в Рунете." },
];

const GeoAudit = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    saveLastUrl(trimmed);
    navigate(`/tools/site-check?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <Helmet>
        <title>GEO-аудит сайта — проверка AI-готовности | OWNDEV</title>
        <meta name="description" content="Проверьте готовность вашего сайта к AI-поиску: ChatGPT, Perplexity, Яндекс Нейро. Анализ llms.txt, E-E-A-T, Schema.org — бесплатно." />
        <link rel="canonical" href="https://owndev.ru/geo-audit" />
        <meta property="og:title" content="GEO-аудит сайта — проверка AI-готовности | OWNDEV" />
        <meta property="og:description" content="Проверьте AI-готовность сайта. LLM Score + SEO Score в одном отчёте." />
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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10 text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              GEO — Generative Engine Optimization
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-6 leading-tight">
              Ваш сайт невидим{" "}
              <br className="hidden sm:block" />
              для <span className="text-gradient">нейросетей</span>?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              ChatGPT, Яндекс Нейро, Perplexity и Claude отвечают на вопросы пользователей — но не цитируют ваш сайт.
              GEO-аудит OWNDEV покажет почему и как это исправить.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
              {stats.map((s, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <Link to="/tools/site-check">
              <Button size="lg" className="text-base">
                Проверить AI-готовность →
              </Button>
            </Link>
          </div>
        </section>

        {/* Evolution: SEO → AI → GEO */}
        <section className="py-16 md:py-20">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-10 text-center">
              Что такое GEO и почему это важно в 2025?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Arrows between columns */}
              <div className="hidden md:flex absolute top-1/2 left-[33%] -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30 text-2xl">→</div>
              <div className="hidden md:flex absolute top-1/2 left-[67%] -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30 text-2xl">→</div>

              {evolution.map((e, i) => (
                <div key={i} className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">{e.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
                    {e.title}
                    {e.pulse && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
              Исследования показывают: сайты с llms.txt, FAQPage разметкой и сильным E-E-A-T получают в 3-4 раза больше упоминаний в AI-ответах.
            </p>
          </div>
        </section>

        {/* 6 audit cards */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-4 text-center">
              Что проверяет <span className="text-gradient">GEO-аудит</span>
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto text-sm">
              6 направлений проверки AI-готовности вашего сайта
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {auditCards.map((card) => (
                <div key={card.title} className="relative group">
                  <GlowingEffect theme="accent" disabled={false} borderWidth={1} spread={20} glow blur={6} />
                  <div className="glass rounded-xl p-5 relative z-10 h-full">
                    <div className="flex items-center justify-between mb-3">
                      <card.icon className="w-6 h-6 text-primary" />
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {card.weight}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold mb-2">{card.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-8 text-center">
              Вопросы и <span className="text-gradient">ответы</span>
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl px-6 border-none">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-sm">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA with input */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="container px-4 md:px-6 relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">
              Проверьте AI-готовность вашего сайта
            </h2>
            <p className="text-muted-foreground mb-8">
              Бесплатно · За 2 минуты · PDF + Word отчёт
            </p>
            <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.ru"
                className="flex-1 h-14 rounded-xl border border-border bg-card/60 backdrop-blur-xl px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
              />
              <Button type="submit" size="lg" className="h-14 px-8 shrink-0">
                Проверить GEO →
              </Button>
            </form>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Ваш LLM Score покажет насколько сайт виден нейросетям
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default GeoAudit;
