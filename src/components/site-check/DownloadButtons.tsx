import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const files = [
  { label: "↓ Скачать PDF", key: "pdf" },
  { label: "↓ Скачать Word", key: "docx" },
  { label: "↓ Ключевые слова", key: "keywords" },
  { label: "↓ Минус-слова", key: "minus" },
];

const DownloadButtons = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "📄 В разработке",
      description: "Генерация отчётов подключается. Мы уведомим вас как только будет готово!",
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {files.map((f) => (
        <Button
          key={f.key}
          variant="outline"
          size="sm"
          className="gap-2 opacity-50 cursor-not-allowed"
          onClick={handleClick}
        >
          <Download className="w-4 h-4" />
          {f.label}
        </Button>
      ))}
      <p className="col-span-full text-xs text-muted-foreground text-center">
        Экспорт отчёта скоро будет доступен
      </p>
    </div>
  );
};

export default DownloadButtons;
