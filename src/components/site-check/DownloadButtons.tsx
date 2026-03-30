import { Download, FileText, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DownloadButtonsProps {
  url: string;
  theme?: string;
  scores: Record<string, number> | null;
  issues: any[];
  keywords: any[];
  minusWords: any[];
  competitors: any[];
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const BOM = mimeType.includes("csv") ? "\uFEFF" : "";
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildKeywordsCsv(keywords: any[]): string {
  const header = "Кластер,Интент,Запрос,Частота,Нужен лендинг";
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = keywords.map((kw) =>
    [esc(kw.cluster), esc(kw.intent), esc(kw.keyword), esc(kw.volume), esc(kw.landing_needed ? "Да" : "")].join(",")
  );
  return [header, ...rows].join("\n");
}

function buildMinusTxt(minusWords: any[]): string {
  return minusWords
    .map((w) => {
      const word = (typeof w === "string" ? w : w.word ?? w.value ?? String(w)).trim();
      return word.startsWith("-") ? word : `-${word}`;
    })
    .join("\n");
}

function buildReportTxt(
  url: string,
  theme: string | undefined,
  scores: Record<string, number> | null,
  issues: any[],
): string {
  const line = "─".repeat(50);
  const scoreBlock = scores
    ? Object.entries(scores).map(([k, v]) => `  ${k}: ${v}`).join("\n")
    : "  Данные недоступны";

  const issuesBlock = issues.length
    ? issues.map((iss, i) => {
        const title = iss.title ?? iss.name ?? "Без названия";
        const desc = iss.description ?? "";
        const sev = iss.severity ?? iss.level ?? "";
        return `  ${i + 1}. [${sev}] ${title}${desc ? `\n     ${desc}` : ""}`;
      }).join("\n")
    : "  Ошибок не обнаружено";

  return [
    "OWNDEV — Отчёт аудита сайта",
    `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
    line,
    `URL:      ${url}`,
    `Тематика: ${theme ?? "Общая"}`,
    line,
    "ОЦЕНКИ:",
    scoreBlock,
    line,
    `ОШИБКИ (${issues.length}):`,
    issuesBlock,
    line,
    "Сгенерировано: owndev.ru",
  ].join("\n");
}

export default function DownloadButtons({
  url,
  theme,
  scores,
  issues,
  keywords,
  minusWords,
}: DownloadButtonsProps) {
  const { toast } = useToast();

  const hostname = (() => {
    try { return new URL(url).hostname; } catch { return "report"; }
  })();

  const handleKeywords = () => {
    if (!keywords?.length) {
      toast({ title: "Нет данных", description: "Ключевые слова не загружены.", variant: "destructive" });
      return;
    }
    downloadBlob(buildKeywordsCsv(keywords), `${hostname}_keywords.csv`, "text/csv;charset=utf-8");
    toast({ title: "✅ Готово", description: `Выгружено ${keywords.length} ключевых слов.` });
  };

  const handleMinusWords = () => {
    if (!minusWords?.length) {
      toast({ title: "Нет данных", description: "Минус-слова не загружены.", variant: "destructive" });
      return;
    }
    downloadBlob(buildMinusTxt(minusWords), `${hostname}_minus.txt`, "text/plain;charset=utf-8");
    toast({ title: "✅ Готово", description: `Выгружено ${minusWords.length} минус-слов.` });
  };

  const handlePdf = () => window.print();

  const handleWord = () => {
    const text = buildReportTxt(url, theme, scores, issues ?? []);
    downloadBlob(text, `${hostname}_report.txt`, "text/plain;charset=utf-8");
    toast({ title: "✅ Готово", description: "Текстовый отчёт скачан." });
  };

  const buttons = [
    { label: "Скачать PDF", icon: <Printer className="w-4 h-4" />, onClick: handlePdf, disabled: false },
    { label: "Скачать отчёт", icon: <FileDown className="w-4 h-4" />, onClick: handleWord, disabled: false },
    { label: "Ключевые слова", icon: <FileText className="w-4 h-4" />, onClick: handleKeywords, disabled: !keywords?.length },
    { label: "Минус-слова", icon: <Download className="w-4 h-4" />, onClick: handleMinusWords, disabled: !minusWords?.length },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
      {buttons.map(({ label, icon, onClick, disabled }) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          className="gap-2"
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
