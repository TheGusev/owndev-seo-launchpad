import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonsProps {
  paid: boolean;
}

const files = [
  { label: "Скачать PDF", key: "pdf" },
  { label: "Скачать DOCX", key: "docx" },
  { label: "Ключи CSV", key: "keywords" },
  { label: "Минус-слова CSV", key: "minus" },
];

const DownloadButtons = ({ paid }: DownloadButtonsProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {files.map((f) => (
      <Button
        key={f.key}
        variant="outline"
        size="sm"
        disabled={!paid}
        className="gap-2"
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

export default DownloadButtons;
