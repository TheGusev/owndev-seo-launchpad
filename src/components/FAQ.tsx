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

const FAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const faqs = [
    {
      question: "Что такое LLM-оптимизация?",
      answer: "LLM-оптимизация — это подготовка контента сайта к тому, чтобы AI-ассистенты (ChatGPT, Perplexity, Google AI Overviews) корректно цитировали и ссылались на ваш сайт. Это включает структурированные данные, FAQ-блоки, чёткую иерархию заголовков и читабельный контент."
    },
    {
      question: "Как попасть в AI Overviews и ответы LLM?",
      answer: "Ключевые факторы: наличие Schema.org разметки (особенно FAQ, HowTo, Article), структурированный контент с подзаголовками, списками и таблицами, а также авторитетность домена. Наш SEO Auditor проверяет все эти факторы и даёт конкретные рекомендации."
    },
    {
      question: "Инструменты действительно бесплатные?",
      answer: "Да, все инструменты полностью бесплатны и без регистрации. Мы зарабатываем на заказной разработке и SEO-сопровождении, а инструменты — это наш способ быть полезными сообществу."
    },
    {
      question: "Можно ли заказать SEO или разработку сайта?",
      answer: "Конечно. Мы делаем сайты под ключ, запускаем pSEO-проекты на тысячи страниц и оптимизируем контент под AI-поиск. Напишите нам в Telegram или через форму обратной связи."
    },
    {
      question: "Что такое pSEO (programmatic SEO)?",
      answer: "Programmatic SEO — это стратегия создания большого количества оптимизированных страниц по шаблону. Например, «услуга + город» для 1000 городов. Наш pSEO Generator помогает спланировать структуру таких проектов."
    },
    {
      question: "Насколько точен SEO-аудит?",
      answer: "Наш аудитор выполняет быструю эвристическую проверку — это не замена полноценному аудиту, но отличная отправная точка. Он проверяет мета-теги, заголовки, структурированные данные, скорость и готовность к LLM-цитированию."
    },
  ];

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
    <section id="faq" className="py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
      <div className="container px-4 md:px-6 relative z-10">
        {/* Desktop */}
        <div className="hidden md:block">
          <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
              Вопросы и <span className="text-gradient">ответы</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Часто задаваемые вопросы об инструментах и LLM‑оптимизации</p>
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
