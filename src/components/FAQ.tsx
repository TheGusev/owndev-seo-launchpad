import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useIsMobile } from "@/hooks/use-mobile";

const FAQ = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  const faqs = [
    {
      question: "Сколько времени занимает разработка сайта?",
      answer: "Зависит от типа проекта: лендинг — 5-7 дней, корпоративный сайт — 2-3 недели, интернет-магазин — 3-4 недели, SaaS-платформа — 2-3 месяца. Точные сроки указаны в нашем прайс-листе выше."
    },
    {
      question: "Нужно ли мне покупать домен и хостинг?",
      answer: "Нет, это уже включено в стоимость первый год. Мы регистрируем домен на ваше имя и размещаем сайт на надежном российском хостинге. После первого года стоимость продления — от 3,000 ₽/год."
    },
    {
      question: "Я не знаю, какой сайт мне нужен. Как выбрать?",
      answer: "Запишитесь на БЕСПЛАТНУЮ консультацию. За 1-1.5 часа мы проанализируем ваш бизнес, конкурентов и целевую аудиторию, и предложим оптимальный вариант с расчетом ROI."
    },
    {
      question: "Можно ли доработать сайт после запуска?",
      answer: "Конечно! В каждый тариф включена техподдержка от 1 до 6 месяцев (зависит от выбранного пакета). После этого предлагаем договор абонентской поддержки от 10,000 ₽/мес с неограниченными правками."
    },
    {
      question: "Вы гарантируете результаты?",
      answer: "Мы гарантируем рост органического трафика минимум на 150% за 6 месяцев при условии SEO-продвижения. Если результата нет по нашей вине, мы работаем бесплатно до его достижения."
    },
    {
      question: "Как часто нужно платить за SEO?",
      answer: "SEO — это постоянная работа. Мы предлагаем месячные подписки от 60,000 ₽/мес. Можно начать с 3-месячного пробного периода. Минимальный рекомендуемый срок для видимых результатов — 6 месяцев."
    },
    {
      question: "Можно ли перенести текущий сайт на новый?",
      answer: "Да, мы переносим все данные, контент, изображения. Сохраняем SEO рейтинг, настраиваем 301-редиректы со старых URL. Это входит в стоимость проекта."
    },
    {
      question: "Какой стек технологий вы используете?",
      answer: "React.js, Next.js для фронтенда, Node.js/Python для бэкенда, PostgreSQL/MongoDB для базы данных. Всё современное, масштабируемое и легко поддерживаемое. Также работаем с WordPress/Tilda для простых проектов."
    }
  ];

  const SectionHeader = () => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-8 md:mb-16"
    >
      <button
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
        className="w-full md:cursor-default"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif flex items-center justify-center gap-3">
          <span>
            Вопросы и{" "}
            <span className="text-gradient">ответы</span>
          </span>
          {isMobile && (
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </motion.span>
          )}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Ответы на часто задаваемые вопросы наших клиентов
        </p>
      </button>
    </motion.div>
  );

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <SectionHeader />

        <AnimatePresence initial={false}>
          {(isExpanded || !isMobile) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="relative group">
                    <GlowingEffect
                      theme="accent"
                      disabled={false}
                      borderWidth={1}
                      spread={20}
                      glow={true}
                      blur={6}
                    />
                    <AccordionItem 
                      value={`item-${index}`}
                      className="glass rounded-xl px-6 border-none relative z-10"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-6">
                        <span className="font-semibold text-foreground">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FAQ;
