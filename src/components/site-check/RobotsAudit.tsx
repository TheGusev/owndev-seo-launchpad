import { Badge } from "@/components/ui/badge";
import { Bot, Shield } from "lucide-react";
import type { RobotsData } from "@/lib/site-check-types";

interface Props {
  robots: RobotsData | null;
}

/**
 * Sprint 5 — Доступ AI-ботов к сайту по robots.txt.
 */
export default function RobotsAudit({ robots }: Props) {
  if (!robots) return null;

  if (!robots.exists) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-300/90 flex gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">robots.txt не найден</p>
          <p className="text-yellow-300/70 mt-0.5">
            AI-боты будут пытаться индексировать всё подряд. Создайте файл с явными правилами.
          </p>
        </div>
      </div>
    );
  }

  const bots = robots.aiBots ?? [];

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Bot className="w-3.5 h-3.5" />
        Доступ AI-ботов
        <span className="ml-auto text-foreground font-medium">
          {robots.allowedAiBots} из {bots.length || robots.allowedAiBots + robots.blockedAiBots}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bots.map((b) => (
          <Badge
            key={b.bot}
            variant={b.allowed ? "default" : "outline"}
            className={
              b.allowed
                ? "bg-emerald-600/70 text-foreground"
                : "opacity-60 line-through"
            }
            title={b.rule}
          >
            {b.bot} {b.allowed ? "✓" : "×"}
          </Badge>
        ))}
      </div>
      {robots.blockedAiBots > 0 && (
        <p className="text-[11px] text-yellow-400/80">
          Заблокировано {robots.blockedAiBots} AI-ботов — это снижает GEO-видимость.
        </p>
      )}
    </div>
  );
}