// GEO Rating Preview — компактный ТОП-5 на главную (Sprint 9 Iter 3).
// Поднимает живой рейтинг ближе к Hero, чтобы был социальный proof и сразу клик в полный рейтинг.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { apiUrl, apiHeaders } from "@/lib/api/config";

type Row = {
  domain: string;
  llm_score: number;
  seo_score: number;
  cro_score?: number | null;
  ai_score?: number | null;
};

const GeoRatingPreview = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/site-check/geo-rating"), { headers: apiHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Row[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setTotal(data.length);
        const top = [...data]
          .sort((a, b) => (b.llm_score || 0) - (a.llm_score || 0))
          .slice(0, 5);
        setRows(top);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.05),transparent_60%)]" />
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-xl md:text-2xl font-bold font-serif">
                ТОП-5 GEO-рейтинга Рунета
              </h2>
            </div>
            <Link
              to="/geo-rating"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
            >
              Весь рейтинг {total > 0 && `(${total})`}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass rounded-2xl border border-border overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Загрузка рейтинга…
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((r, i) => (
                  <li
                    key={r.domain}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-card/40 transition-colors"
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : i === 1
                          ? "bg-slate-400/20 text-slate-300"
                          : i === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Link
                      to={`/geo-rating?focus=${encodeURIComponent(r.domain)}`}
                      className="flex-1 min-w-0 truncate text-sm md:text-base font-medium hover:text-primary"
                    >
                      {r.domain}
                    </Link>
                    <div className="flex items-center gap-2 md:gap-3 text-xs shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono">
                        LLM {r.llm_score}
                      </span>
                      <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                        SEO {r.seo_score}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground/70 mt-3 text-center">
            Реальные баллы по 6 осям: GEO, SEO, CRO, Schema, Директ, AI.
            Обновляется при каждом сканировании.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default GeoRatingPreview;
