import { Lock, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallCTAProps {
  title: string;
  features: string[];
  onUnlock: () => void;
}

export function PaywallCTA({ title, features, onUnlock }: PaywallCTAProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border/70 bg-card/40 p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">Доступно в полном GEO-аудите</p>
        </div>
      </div>

      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-1.5">
        <Button
          variant="hero"
          size="sm"
          className="w-full gap-2"
          onClick={onUnlock}
        >
          <Zap className="w-3.5 h-3.5" />
          Запустить полный аудит
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Бесплатно · Занимает 30–60 сек
        </p>
      </div>
    </div>
  );
}
