import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Helmet } from "react-helmet-async";

const FAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const faqs = [
    {
      question: "Что такое GEO-аудит?",
      answer: "GEO (Generative Engine Optimization) — это оптимизация сайта не только для поисковиков, но и для AI-ответов ChatGPT, Яндекс Нейро и Perplexity. OWNDEV первым в Рунете делает это автоматически."
    },
    {
      question: "Чем OWNDEV отличается от PR-CY?",
      answer: "PR-CY — отличный классический SEO-инструмент. OWNDEV делает то же самое + проверяет AI-готовность сайта, генерирует llms.txt и показывает LLM Score — это недоступно ни у одного российского конкурента."
    },
    {
      question: "Что такое LLM Score?",
      answer: "LLM Score — оценка от 0 до 100, показывающая насколько сайт готов к попаданию в AI-ответы нейросетей. Учитывает структуру контента, E-E-A-T, Schema.org и наличие llms.txt."
    },
    {
      question: "Это бесплатно?",
      answer: "Да. Базовый аудит с SEO Score, LLM Score и планом исправления — полностью бесплатно. Без регистрации."
    },
    {
      question: "Что такое pSEO (programmatic SEO)?",
      answer: "Programmatic SEO — это стратегия создания большого количества оптимизированных страниц по шаблону. Например, «услуга + город» для 1000 городов. Наш pSEO Generator помогает спланировать структуру таких проектов."
    },
    {
      question: "Насколько точен аудит?",
      answer: "Наш аудитор выполняет быструю AI-проверку по 20+ параметрам SEO и AI-готовности — это не замена полноценному аудиту, но отличная отправная точка с конкретным планом действий."
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const FAQContent = () => (
    <Accordion type="single" collapsible className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="relative group">
          <GlowingEffect theme="accent" disabled={false} borderWidth={1} spread={20} glow={true} blur={6} />
          <AccordionItem value={`item-${index}`} className="glass rounded-xl px-6 border-none relative z-10">
            <AccordionTrigger className="text-left hover:no-underline py-6">
              <span className="font-semibold text-foreground">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-6">{faq.answer}</AccordionContent>
          </AccordionItem>
        </div>
      ))}
    </Accordion>
  );

  return (
    <section id="faq" className="py-12 md:py-24 relative overflow-hidden" aria-label="Часто задаваемые вопросы">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
      <div className="container px-4 md:px-6 relative z-10">
        {/* Desktop */}
        <div className="hidden md:block">
          <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
              Вопросы и <span className="text-gradient">ответы</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Часто задаваемые вопросы о GEO‑аудите и AI‑ready SEO</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-3xl mx-auto">
            <FAQContent />
          </motion.div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full glass rounded-xl p-6 flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-2xl font-bold font-serif">Вопросы и <span className="text-gradient">ответы</span></h2>
                <p className="text-muted-foreground text-sm mt-1">Нажмите, чтобы раскрыть</p>
              </div>
              <ChevronDown className={`w-6 h-6 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-6">
              <FAQContent />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
