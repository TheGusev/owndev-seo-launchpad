import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const exportTypes = [
  { value: "semantic", label: "Семантическое ядро" },
  { value: "structure", label: "Структура страниц" },
  { value: "audit", label: "Результаты аудита" },
  { value: "positions", label: "Позиции по запросам" },
];

const CSVExport = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Что экспортировать</label>
          <Select>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Выберите данные…" />
            </SelectTrigger>
            <SelectContent>
              {exportTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Формат</label>
          <Select>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="CSV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-center space-y-2">
          <GradientButton size="lg" disabled>
            <Download className="w-5 h-5 mr-2" />
            Скачать файл
          </GradientButton>
          <Badge variant="secondary" className="ml-2">Скоро</Badge>
        </div>

        <div className="glass rounded-xl p-5 text-center">
          <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Инструмент в разработке — скоро здесь появится экспорт</p>
        </div>
      </div>
    </div>
  );
};

export default CSVExport;
