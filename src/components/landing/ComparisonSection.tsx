import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const rows = [
  { feature: "GEO / AI-ready аудит", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "Анализ llms.txt", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "LLM Score (AI-видимость)", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "Schema.org генератор", owndev: true, semrush: false, screaming: false, arsenkin: "partial" },
  { feature: "Семантика 150+ ключей", owndev: true, semrush: true, screaming: false, arsenkin: true },
  { feature: "Анализ конкурентов в SERP", owndev: true, semrush: true, screaming: false, arsenkin: "partial" },
  { feature: "Минус-слова для Директа", owndev: true, semrush: false, screaming: false, arsenkin: true },
  { feature: "PDF + Word отчёт", owndev: true, semrush: "partial", screaming: false, arsenkin: false },
  { feature: "На русском языке", owndev: true, semrush: "partial", screaming: false, arsenkin: true },
  { feature: "Бесплатно", owndev: true, semrush: false, screaming: false, arsenkin: false },
];

const renderCell = (val: boolean | string) => {
  if (val === true) return <span className="text-emerald-400">✅</span>;
  if (val === "partial") return <span className="text-yellow-400">⚠️</span>;
  return <span className="text-muted-foreground/30">❌</span>;
};

const ComparisonSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-12 md:py-20 relative">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">OWNDEV vs стандартные SEO-инструменты</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-border overflow-hidden bg-card/40"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 md:p-4 font-medium text-muted-foreground">Функция</th>
                  <th className="p-3 md:p-4 font-bold text-primary bg-primary/10 text-center">OWNDEV</th>
                  <th className="p-3 md:p-4 font-medium text-muted-foreground text-center">Semrush</th>
                  <th className="p-3 md:p-4 font-medium text-muted-foreground text-center">Screaming Frog</th>
                  <th className="p-3 md:p-4 font-medium text-muted-foreground text-center">Арсенкин</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="p-3 md:p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-3 md:p-4 text-center bg-primary/5">{renderCell(row.owndev)}</td>
                    <td className="p-3 md:p-4 text-center">{renderCell(row.semrush)}</td>
                    <td className="p-3 md:p-4 text-center">{renderCell(row.screaming)}</td>
                    <td className="p-3 md:p-4 text-center">{renderCell(row.arsenkin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="text-center text-muted-foreground/50 text-xs mt-4">
          * Все инструменты требуют платной подписки, кроме OWNDEV
        </p>
      </div>
    </section>
  );
};

export default ComparisonSection;
