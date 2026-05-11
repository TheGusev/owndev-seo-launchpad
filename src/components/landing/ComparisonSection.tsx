import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Check, X, Minus, Crown, Sparkles } from "lucide-react";
import { ScanLine } from "@/components/ui/scan-line";

/**
 * PR-16: компактная единая таблица для всех брейкпоинтов.
 *  — на мобилке вместо «портянки» из карточек — горизонтальный скролл
 *    единой таблицы с sticky левой колонкой и фиксированной высотой строк.
 *  — иконки lucide (Check / Minus / X) вместо эмодзи.
 *  — компактный шрифт (text-xs/sm), читается на iPhone SE (375 px).
 *
 * История:
 *  — PR-15 ввёл карточный mobile-вид и фид «портянка»: пользователь
 *    попросил откатить к таблице.
 */

type CellState = true | false | "partial";

interface Row {
  feature: string;
  hint?: string;
  owndev: CellState;
  semrush: CellState;
  screaming: CellState;
  arsenkin: CellState;
}

const rows: Row[] = [
  // GEO/AI — фишка только OWNDEV, никто из конкурентов не делает
  { feature: "GEO / AI-ready аудит", hint: "Готовность к выдаче в ChatGPT, Perplexity, Алисе", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "LLM Score (AI-видимость)", hint: "Оценка вероятности попасть в AI-ответ", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "Анализ llms.txt", hint: "Парсинг и валидация политики для AI-ботов", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "Schema.org JSON-LD генератор", hint: "12 типов разметки готовыми блоками", owndev: true, semrush: false, screaming: false, arsenkin: "partial" },
  { feature: "GEO-рейтинг Рунета", hint: "Открытый рейтинг 92+ сайтов", owndev: true, semrush: false, screaming: false, arsenkin: false },

  // SEO-ядро — где OWNDEV паритетен и обходит
  { feature: "Семантика 150+ ключей с Wordstat", owndev: true, semrush: true, screaming: false, arsenkin: true },
  { feature: "Анализ конкурентов в SERP", owndev: true, semrush: true, screaming: false, arsenkin: "partial" },
  { feature: "Минус-слова для Яндекс.Директ", owndev: true, semrush: false, screaming: false, arsenkin: true },
  { feature: "Технический SEO-аудит", owndev: true, semrush: true, screaming: true, arsenkin: "partial" },
  { feature: "E-E-A-T анализ авторитета", owndev: true, semrush: "partial", screaming: false, arsenkin: false },

  // Доступность и удобство
  { feature: "Полностью на русском", owndev: true, semrush: "partial", screaming: false, arsenkin: true },
  { feature: "PDF + Word отчёт без водяных знаков", owndev: true, semrush: "partial", screaming: false, arsenkin: false },
  { feature: "super_prompt_pack для Lovable / Cursor", hint: "ZIP с готовым ТЗ для AI-разработки", owndev: true, semrush: false, screaming: false, arsenkin: false },
  { feature: "Бесплатный тариф без ограничений", owndev: true, semrush: false, screaming: false, arsenkin: false },
];

const competitors = [
  {
    key: "owndev",
    name: "OWNDEV",
    short: "OWN",
    isUs: true,
    badge: "флагман",
    pricing: "Бесплатно",
    icon: Crown,
  },
  {
    key: "semrush",
    name: "Semrush",
    short: "SR",
    isUs: false,
    badge: "$140/мес",
    pricing: "от $139.95/мес",
  },
  {
    key: "screaming",
    name: "Screaming Frog",
    short: "SF",
    isUs: false,
    badge: "£259/год",
    pricing: "£259/год",
  },
  {
    key: "arsenkin",
    name: "Арсенкин",
    short: "АРС",
    isUs: false,
    badge: "₽1500/мес",
    pricing: "от 1500 ₽/мес",
  },
] as const;

// Подсчёт «выигранных» фич — используется в саммари сверху
const score = (key: typeof competitors[number]["key"]) => {
  let s = 0;
  for (const r of rows) {
    const v = r[key as keyof Row] as CellState;
    if (v === true) s += 1;
    else if (v === "partial") s += 0.5;
  }
  return s;
};

const Cell = ({ value, accent }: { value: CellState; accent?: boolean }) => {
  if (value === true) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
          accent
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
            : "bg-success/15 text-success"
        }`}
        aria-label="Есть"
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-warning/15 text-warning"
        aria-label="Частично"
      >
        <Minus className="w-4 h-4" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground/40"
      aria-label="Нет"
    >
      <X className="w-4 h-4" strokeWidth={2.5} />
    </span>
  );
};

const ComparisonSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const totalFeatures = rows.length;

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <ScanLine className="z-0" duration={12} opacity={0.18} />
      <div className="container px-4 md:px-6 max-w-5xl mx-auto relative z-10">
        {/* Заголовок */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Прямое сравнение с лидерами рынка
          </div>
          <h2 className="text-2xl md:text-4xl font-bold font-serif mb-3">
            OWNDEV vs популярные SEO-инструменты
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Единственный в Рунете сервис, который проверяет сайт и для классического SEO,
            и для AI-выдачи (ChatGPT, Perplexity, Алиса) — в одном бесплатном отчёте
          </p>
        </motion.div>

        {/* Саммари-счёт сверху — сразу видно «кто выиграл» */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6 md:mb-8"
        >
          {competitors.map((c) => {
            const s = score(c.key);
            const pct = Math.round((s / totalFeatures) * 100);
            return (
              <div
                key={c.key}
                className={`relative p-3 md:p-4 rounded-xl border ${
                  c.isUs
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_24px_hsl(var(--primary)/0.18)]"
                    : "bg-card border-border"
                }`}
              >
                {c.isUs && (
                  <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                    {c.badge}
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`font-bold text-sm md:text-base ${c.isUs ? "text-primary" : "text-foreground"}`}>
                    {c.name}
                  </span>
                  <span className={`font-mono text-xs md:text-sm ${c.isUs ? "text-primary" : "text-muted-foreground"}`}>
                    {s}/{totalFeatures}
                  </span>
                </div>
                {/* Прогресс-бар */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${pct}%` } : {}}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      c.isUs
                        ? "bg-gradient-to-r from-primary to-accent"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
                <p className="mt-2 text-[10px] md:text-xs text-muted-foreground truncate">
                  {c.pricing}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Единая таблица — на мобилке скроллится горизонтально,
            левая колонка с фичей прибивается к краю (sticky). */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-border overflow-hidden bg-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[560px] sm:min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/95 backdrop-blur-sm text-left px-3 py-3 sm:px-4 sm:py-4 font-semibold text-muted-foreground border-r border-border min-w-[180px] sm:min-w-[260px]">
                    Функция
                  </th>
                  {competitors.map((c) => (
                    <th
                      key={c.key}
                      className={`px-2 py-3 sm:px-4 sm:py-4 font-semibold text-center min-w-[78px] sm:min-w-[120px] ${
                        c.isUs
                          ? "text-primary bg-primary/8 border-x border-primary/20"
                          : "text-foreground"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="truncate max-w-[88px] sm:max-w-none">{c.name}</span>
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono ${
                            c.isUs ? "text-primary/80" : "text-muted-foreground/70"
                          }`}
                        >
                          {c.pricing}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors h-14 sm:h-16"
                  >
                    <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm border-r border-border/60 px-3 py-2 sm:px-4 sm:py-3 font-medium text-foreground">
                      <div className="leading-tight">{row.feature}</div>
                      {row.hint && (
                        <div className="text-[10px] sm:text-xs text-muted-foreground font-normal mt-0.5 leading-snug line-clamp-2">
                          {row.hint}
                        </div>
                      )}
                    </td>
                    {competitors.map((c) => {
                      const v = row[c.key as keyof Row] as CellState;
                      return (
                        <td
                          key={c.key}
                          className={`px-2 py-2 sm:px-4 sm:py-3 text-center ${
                            c.isUs ? "bg-primary/8 border-x border-primary/20" : ""
                          }`}
                        >
                          <div className="flex justify-center">
                            <Cell value={v} accent={c.isUs} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Подсказка для мобилки про горизонтальный скролл */}
          <p className="md:hidden text-[10px] text-muted-foreground/70 text-center px-3 py-2 border-t border-border/40">
            Сдвиньте таблицу влево, чтобы увидеть всех конкурентов
          </p>
        </motion.div>

        {/* Подпись */}
        <p className="text-center text-muted-foreground text-xs mt-4 md:mt-6 max-w-2xl mx-auto">
          Сравнение по публичным данным конкурентов на май 2026.
          Цены приведены за минимальный тариф; OWNDEV — единственный полностью бесплатный сервис.
        </p>
      </div>
    </section>
  );
};

export default ComparisonSection;
