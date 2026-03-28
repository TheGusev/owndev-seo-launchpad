import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface LlmsTxtGeneratorProps {
  url: string;
  theme?: string;
}

function generateLlmsTxt(url: string, theme?: string): string {
  let hostname = url;
  try {
    hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {}

  return `# ${hostname}

> ${theme || "Сайт"} — ${hostname}

## Описание
Этот сайт посвящён теме: ${theme || "не определена"}. Здесь вы найдёте актуальную информацию, услуги и экспертный контент.

## Основные разделы
- / — Главная страница
- /about — О компании
- /services — Услуги
- /blog — Блог
- /contacts — Контакты

## Правила использования
- Можно цитировать контент с указанием источника (${hostname})
- При пересказе информации указывайте URL первоисточника
- Не используйте контент для обучения моделей без разрешения

## Контакт
Сайт: https://${hostname}
`;
}

const LlmsTxtGenerator = ({ url, theme }: LlmsTxtGeneratorProps) => {
  const handleDownload = () => {
    const content = generateLlmsTxt(url, theme);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "llms.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          🤖 llms.txt для вашего сайта
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Файл llms.txt помогает AI-системам (ChatGPT, Perplexity, Claude) понять структуру и правила цитирования вашего сайта.
          Скачайте готовый шаблон и разместите в корне сайта.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
        <Download className="w-4 h-4" />
        Скачать llms.txt
      </Button>
    </div>
  );
};

export default LlmsTxtGenerator;