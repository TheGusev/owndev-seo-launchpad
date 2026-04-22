import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Stage0Data } from "@/lib/site-check-types";

interface Props {
  stage0: Stage0Data | null;
  finalUrl: string;
}

/**
 * Sprint 5 — Визуализация цепочки редиректов + базовых заголовков.
 * Не показываем блок если редиректов нет и заголовки пустые.
 */
export default function RedirectChain({ stage0, finalUrl }: Props) {
  if (!stage0) return null;

  const chain = stage0.redirectChain ?? [];

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        Производительность и редиректы
      </div>

      {chain.length > 0 ? (
        <div className="rounded-lg border border-border/40 bg-card/40 p-3 space-y-1">
          <p className="text-[11px] text-muted-foreground mb-1">
            Цепочка редиректов ({stage0.redirectCount}):
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            {chain.map((hop, i) => (
              <div key={i} className="inline-flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground/80 truncate max-w-[200px]">
                  {hop.from}
                </span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {hop.status}
                </Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[200px]">
              {finalUrl}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Прямой ответ без редиректов (хорошо для скорости).
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <Stat label="HTTP" value={String(stage0.httpStatus)} good={stage0.httpStatus < 400} />
        <Stat label="TTFB" value={`${stage0.ttfbMs} ms`} good={stage0.ttfbMs < 800} warn={stage0.ttfbMs < 1500} />
        <Stat label="HTTPS" value={stage0.isHttps ? "Да" : "Нет"} good={stage0.isHttps} />
        <Stat label="Сжатие" value={stage0.compression || "—"} good={!!stage0.compression} />
      </div>
    </div>
  );
}

function Stat({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  const cls = good
    ? "border-emerald-500/30 text-emerald-400"
    : warn
    ? "border-yellow-500/30 text-yellow-400"
    : "border-destructive/30 text-destructive";
  return (
    <div className={`rounded-md border ${cls} bg-card/30 px-2 py-1.5 text-center`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}