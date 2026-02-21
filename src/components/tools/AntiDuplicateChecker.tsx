import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Shield } from "lucide-react";

const AntiDuplicateChecker = () => {
  const [score] = useState(0);

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      {/* Safety scale */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">Безопасность контента</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-destructive via-warning to-success rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">{score}/100</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Текст для проверки</label>
          <Textarea
            placeholder="Вставьте текст pSEO-страницы…"
            className="bg-card border-border min-h-[180px]"
          />
          <p className="text-xs text-muted-foreground">Мы не сохраняем контент на сервере.</p>
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Shield className="w-5 h-5 mr-2" />
            Проверить уникальность
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default AntiDuplicateChecker;
