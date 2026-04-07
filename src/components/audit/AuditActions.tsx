import { Save, FileDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AuditActions = () => {
  const stub = (label: string) => () => toast.info(`${label} — функция в разработке`);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={stub("Сохранить результат")}>
        <Save className="w-4 h-4 mr-1.5" /> Сохранить
      </Button>
      <Button variant="outline" size="sm" onClick={stub("Экспорт в PDF")}>
        <FileDown className="w-4 h-4 mr-1.5" /> Экспорт PDF
      </Button>
      <Button variant="outline" size="sm" onClick={stub("Поделиться")}>
        <Share2 className="w-4 h-4 mr-1.5" /> Поделиться
      </Button>
    </div>
  );
};

export default AuditActions;
