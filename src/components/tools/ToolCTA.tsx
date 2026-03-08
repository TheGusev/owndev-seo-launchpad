import { Send } from "lucide-react";

const ToolCTA = () => (
  <div className="glass rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
    <p className="text-sm text-muted-foreground flex-1">
      Хотите, чтобы всё это сделали за вас? Мы можем взять проект под ключ.
    </p>
    <a
      href="/#contact"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
    >
      <Send className="w-3.5 h-3.5" />
      Обсудить проект
    </a>
  </div>
);

export default ToolCTA;
