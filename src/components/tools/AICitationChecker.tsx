import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Bot, CheckCircle2, Circle } from "lucide-react";

const checkpoints = [
  { label: "Вопросные H2", done: false },
  { label: "TL;DR блоки", done: false },
  { label: "Schema.org разметка", done: false },
  { label: "Локальные факты", done: false },
];

const AICitationChecker = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        {/* Left: form */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL страницы</label>
            <Input placeholder="https://example.com/uslugi/moskva" className="bg-card border-border" />
          </div>

          <GradientButton size="lg">
            <Bot className="w-5 h-5 mr-2" />
            Проверить AI-готовность
          </GradientButton>

          <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
            Введите URL и нажмите «Проверить» для анализа
          </div>
        </div>

        {/* Right: checklist */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground mb-4">Чекпоинты AI-готовности</p>
          {checkpoints.map((cp) => (
            <div key={cp.label} className="flex items-center gap-3 glass rounded-lg px-4 py-3">
              {cp.done ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
              )}
              <span className="text-sm text-muted-foreground">{cp.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICitationChecker;
