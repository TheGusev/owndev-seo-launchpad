import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  paid: boolean;
}

const files = [
  { label: "↓ Скачать PDF", key: "pdf" },
  { label: "↓ Скачать Word", key: "docx" },
  { label: "↓ Ключевые слова", key: "keywords" },
  { label: "↓ Минус-слова", key: "minus" },
];

const DownloadButtons = ({ paid }: DownloadButtonsProps) => {
  const { toast } = useToast();

  const handleClick = () => {
    // TODO: заменить на реальное скачивание после подключения ЮKassa
    toast({
      title: "Бета-тестирование",
      description: "Генерация PDF-отчетов находится на этапе бета-тестирования",
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {files.map((f) => (
        <Button
          key={f.key}
          variant="outline"
          size="sm"
          disabled={!paid}
          className="gap-2"
          onClick={paid ? handleClick : undefined}
        >
          <Download className="w-4 h-4" />
          {f.label}
        </Button>
      ))}
      {!paid && (
        <p className="col-span-full text-xs text-muted-foreground text-center">
          Доступно после оплаты
        </p>
      )}
    </div>
  );
};

export default DownloadButtons;
