import { Send } from "lucide-react";
import SiteCheckBanner from "@/components/SiteCheckBanner";
import { openLead } from "@/lib/leadCapture";

interface ToolCTAProps {
  /** Название инструмента, на котором стоит CTA — попадёт в TG-сообщение. */
  toolName?: string;
}

const ToolCTA = ({ toolName }: ToolCTAProps) => (
  <div className="space-y-0">
    <div className="glass rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
      <p className="text-sm text-muted-foreground flex-1">
        Хотите, чтобы всё это сделали за вас? Мы можем взять проект под ключ.
      </p>
      <button
        type="button"
        onClick={() =>
          openLead({
            source: toolName ? `Инструмент: ${toolName}` : "Бесплатные инструменты",
            subject: "Обсудить проект под ключ",
            description: "Расскажите про задачу — предложим формат работы и оценку.",
            ctaLabel: "Обсудить проект",
            contextData: toolName ? { "Точка входа": toolName } : undefined,
          })
        }
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
      >
        <Send className="w-3.5 h-3.5" />
        Обсудить проект
      </button>
    </div>
    <SiteCheckBanner />
  </div>
);

export default ToolCTA;
