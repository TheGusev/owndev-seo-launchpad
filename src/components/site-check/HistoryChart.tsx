import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getDomainHistory, type DomainHistoryPoint } from "@/lib/api/scan";

interface HistoryChartProps {
  url: string;
}

const SERIES = [
  { key: "total", label: "Total", color: "hsl(var(--primary))" },
  { key: "seo", label: "SEO", color: "hsl(180 70% 50%)" },
  { key: "ai", label: "AI", color: "hsl(265 70% 65%)" },
  { key: "schema", label: "Schema", color: "hsl(35 85% 55%)" },
  { key: "direct", label: "Direct", color: "hsl(150 65% 50%)" },
] as const;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch {
    return iso;
  }
}

const HistoryChart = ({ url }: HistoryChartProps) => {
  const [history, setHistory] = useState<DomainHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDomainHistory(url, 20)
      .then((res) => {
        if (!cancelled) setHistory(res?.history ?? []);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? "Ошибка загрузки истории");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/40 p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Загружаем историю сканов…</p>
      </div>
    );
  }

  if (error) return null;
  if (!history || history.length === 0) return null;

  if (history.length < 2) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Динамика оценок</h3>
        <p className="text-xs text-muted-foreground">
          Сделайте повторный скан через 1–2 недели, чтобы увидеть, как меняются оценки.
        </p>
      </div>
    );
  }

  const data = history.map((h) => ({
    date: formatDate(h.created_at),
    total: h.total ?? 0,
    seo: h.seo ?? 0,
    ai: h.ai ?? 0,
    schema: h.schema ?? 0,
    direct: h.direct ?? 0,
  }));

  const first = history[0];
  const last = history[history.length - 1];
  const delta = (last.total ?? 0) - (first.total ?? 0);
  const days = Math.max(
    1,
    Math.round(
      (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const trendIcon =
    delta > 0 ? (
      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    ) : delta < 0 ? (
      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
    ) : (
      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
    );
  const trendColor =
    delta > 0 ? "text-emerald-500" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  const trendText =
    delta === 0
      ? `Без изменений за ${days} дн.`
      : `${delta > 0 ? "+" : ""}${Math.round(delta)} баллов за ${days} дн.`;

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">
          Динамика оценок ({history.length} сканов)
        </h3>
        <div className={`inline-flex items-center gap-1 text-xs ${trendColor}`}>
          {trendIcon}
          <span>{trendText}</span>
        </div>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.key === "total" ? 2.5 : 1.5}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;