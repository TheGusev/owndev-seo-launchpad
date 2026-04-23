import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FileDown, FileText } from "lucide-react";
import { TypingCodeBlock } from "@/components/ui/typing-code-block";

const pdfItems = [
  "Триада скоров: GEO / SEO / CRO",
  "Технический паспорт сайта",
  "Schema.org валидация (типы и ошибки)",
  "robots.txt + AI-боты (GPTBot, Claude, Perplexity)",
  "llms.txt / llms-full.txt анализ",
  "GEO/CRO сигналы (E-E-A-T, формы, CTA)",
  "Бенчмарк по категории сайта",
  "Приоритетный action plan с шагами",
];

const wordItems = [
  "Все разделы PDF + редактирование",
  "Пример кода для каждой ошибки",
  "Оглавление с навигацией",
  "Колонтитулы с номерами страниц",
  "Тёмная тема (Calibri, A4)",
  "Идеально для клиентских презентаций",
];

const scrollToInput = () => {
  document.getElementById("site-check-input")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    (document.querySelector("#site-check-input input") as HTMLInputElement)?.focus();
  }, 600);
};

const ReportValue = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-12 md:py-20 relative">
      <div className="container px-4 md:px-6 max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">Что вы получите в отчёте</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PDF */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl border border-border bg-card/40"
          >
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2"><FileDown className="w-5 h-5 text-primary" /> PDF-отчёт</h3>
            <p className="text-xs text-muted-foreground mb-4">Брендированный документ агентского уровня</p>
            <ul className="space-y-2">
              {pdfItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Word */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl border border-border bg-card/40"
          >
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Word-отчёт</h3>
            <p className="text-xs text-muted-foreground mb-4">Редактируемый документ для команды</p>
            <ul className="space-y-2">
              {wordItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-8 max-w-2xl mx-auto">
          <TypingCodeBlock
            title="report.json"
            variant="ide"
            mobileVariant="compact"
            speed={26}
            lineDelay={180}
            lines={[
              "// OWNDEV audit export",
              '{ "url": "https://yoursite.ru",',
              '  "geo_score": 78,',
              '  "seo_score": 87,',
              '  "cro_score": 65,',
              '  "issues": 12, "fixes": 12,',
              '  "exports": ["pdf", "docx"] }',
            ]}
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={scrollToInput}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-foreground bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-sm"
          >
            Получить отчёт →
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReportValue;
