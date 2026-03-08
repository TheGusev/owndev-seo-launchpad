import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Bot, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const checkpoints = [
  { label: "Вопросные H2" },
  { label: "TL;DR блоки" },
  { label: "Schema.org разметка" },
  { label: "Локальные факты" },
];

const AICitationChecker = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL страницы</label>
            <Input placeholder="https://example.com/uslugi/moskva" className="bg-card border-border" />
          </div>

          <div className="space-y-2">
            <GradientButton size="lg" disabled>
              <Bot className="w-5 h-5 mr-2" />
              Проверить AI-готовность
            </GradientButton>
            <Badge variant="secondary" className="ml-2">Скоро</Badge>
          </div>

          <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
            Инструмент в разработке — скоро здесь появится анализ AI-готовности
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground mb-4">Чекпоинты AI-готовности</p>
          {checkpoints.map((cp) => (
            <div key={cp.label} className="flex items-center gap-3 glass rounded-lg px-4 py-3">
              <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
              <span className="text-sm text-muted-foreground">{cp.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICitationChecker;
