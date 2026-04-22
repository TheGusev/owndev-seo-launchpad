import { FileDown, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generatePdfReport } from "@/lib/generatePdfReport";
import { generateWordReport } from "@/lib/generateWordReport";
import type { ReportData } from "@/lib/reportHelpers";

interface DownloadButtonsProps {
  url: string;
  theme?: string;
  scores: Record<string, number> | null;
  issues: any[];
  scanDate?: string;
  seoData?: any;
  comparisonTable?: any;
  directMeta?: any;
}

export default function DownloadButtons({
  url,
  theme,
  scores,
  issues,
  scanDate,
  seoData,
  comparisonTable,
  directMeta,
}: DownloadButtonsProps) {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  const hostname = (() => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return "report"; }
  })();

  const buildReportData = (): ReportData => ({
    url,
    domain: hostname,
    theme: theme || 'Общая тематика',
    scanDate: scanDate || new Date().toISOString(),
    scores: {
      total: scores?.total || 0,
      seo: scores?.seo || 0,
      direct: scores?.direct || 0,
      schema: scores?.schema || 0,
      ai: scores?.ai || 0,
      // Sprint 6: пробрасываем новые скоры если они пришли с бэка
      ...(typeof scores?.geo === 'number' ? { geo: scores.geo } : {}),
      ...(typeof scores?.cro === 'number' ? { cro: scores.cro } : {}),
    },
    issues: issues || [],
    keywords: [],
    minusWords: [],
    competitors: [],
    comparisonTable: comparisonTable || null,
    directMeta: directMeta || null,
    seoData: seoData || {},
  });

  const handlePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast({ title: "⏳ Генерируем PDF...", description: "Создаём полный отчёт" });
      await generatePdfReport(buildReportData());
      toast({ title: "✅ PDF готов!", description: "Файл сохранён на устройство" });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: "Ошибка PDF", description: "Попробуйте снова", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWord = async () => {
    try {
      setIsGeneratingWord(true);
      toast({ title: "⏳ Генерируем Word...", description: "Создаём DOCX-документ" });
      await generateWordReport(buildReportData());
      toast({ title: "✅ Word готов!", description: "Файл сохранён на устройство" });
    } catch (err) {
      console.error('Word error:', err);
      toast({ title: "Ошибка Word", description: "Попробуйте снова", variant: "destructive" });
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const buttons = [
    { label: isGeneratingPdf ? "Генерируем..." : "PDF-отчёт", icon: isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />, onClick: handlePdf, disabled: isGeneratingPdf },
    { label: isGeneratingWord ? "Генерируем..." : "Word-отчёт", icon: isGeneratingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />, onClick: handleWord, disabled: isGeneratingWord },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 no-print">
      {buttons.map(({ label, icon, onClick, disabled }) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          className="gap-2 min-h-[44px]"
          onClick={onClick}
          disabled={disabled}
        >
          {icon}
          {label}
        </Button>
      ))}
    </div>
  );
}
