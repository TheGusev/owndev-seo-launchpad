import { Download, FileText, FileDown, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generatePdfReport } from "@/lib/generatePdfReport";
import { generateWordReport } from "@/lib/generateWordReport";
import { saveAs } from "file-saver";
import type { ReportData } from "@/lib/reportHelpers";

interface DownloadButtonsProps {
  url: string;
  theme?: string;
  scores: Record<string, number> | null;
  issues: any[];
  keywords: any[];
  minusWords: any[];
  competitors: any[];
  scanDate?: string;
  seoData?: any;
  comparisonTable?: any;
  directMeta?: any;
  isBasic?: boolean;
}

export default function DownloadButtons({
  url,
  theme,
  scores,
  issues,
  keywords,
  minusWords,
  competitors,
  scanDate,
  seoData,
  comparisonTable,
  directMeta,
  isBasic = false,
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
    },
    issues: issues || [],
    keywords: keywords || [],
    minusWords: minusWords || [],
    competitors: competitors || [],
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

  const handleKeywords = () => {
    if (!keywords?.length) {
      toast({ title: "Нет данных", description: "Ключевые слова не загружены.", variant: "destructive" });
      return;
    }
    const header = "Запрос,Кластер,Интент,Частота,Нужен лендинг";
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = keywords.map((kw) =>
      [esc(kw.phrase || kw.keyword), esc(kw.cluster), esc(kw.intent), esc(kw.frequency || kw.volume || 0), esc(kw.landing_needed ? "Да" : "")].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `owndev_keywords_${hostname}.csv`);
    toast({ title: "✅ Готово", description: `Выгружено ${keywords.length} ключевых слов.` });
  };

  const handleMinusWords = () => {
    if (!minusWords?.length) {
      toast({ title: "Нет данных", description: "Минус-слова не загружены.", variant: "destructive" });
      return;
    }
    const content = minusWords.map((w) => `-${(w.word ?? '').trim()}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    saveAs(blob, `owndev_minus_${hostname}.txt`);
    toast({ title: "✅ Готово", description: `Выгружено ${minusWords.length} минус-слов.` });
  };

  const buttons = [
    { label: isGeneratingPdf ? "Генерируем..." : "PDF-отчёт", icon: isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />, onClick: handlePdf, disabled: isGeneratingPdf || isBasic },
    { label: isGeneratingWord ? "Генерируем..." : "Word-отчёт", icon: isGeneratingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />, onClick: handleWord, disabled: isGeneratingWord || isBasic },
    { label: "Ключевые слова", icon: <FileText className="w-4 h-4" />, onClick: handleKeywords, disabled: !keywords?.length || isBasic },
    { label: "Минус-слова", icon: <Download className="w-4 h-4" />, onClick: handleMinusWords, disabled: !minusWords?.length || isBasic },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
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
