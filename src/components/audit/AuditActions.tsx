import { Save, FileDown, Share2 } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { toast } from "sonner";

const AuditActions = () => {
  const stub = (label: string) => () => toast.info(`${label} — функция в разработке`);

  return (
    <div className="flex flex-wrap gap-3">
      <GradientButton variant="outline" size="sm" onClick={stub("Сохранить результат")}>
        <Save className="w-4 h-4 mr-1.5" /> Сохранить
      </GradientButton>
      <GradientButton variant="outline" size="sm" onClick={stub("Экспорт в PDF")}>
        <FileDown className="w-4 h-4 mr-1.5" /> Экспорт PDF
      </GradientButton>
      <GradientButton variant="outline" size="sm" onClick={stub("Поделиться")}>
        <Share2 className="w-4 h-4 mr-1.5" /> Поделиться
      </GradientButton>
    </div>
  );
};

export default AuditActions;
