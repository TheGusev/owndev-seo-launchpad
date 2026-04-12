import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface AutoFixGeneratorProps {
  issueTitle: string;
  url: string;
  pageTitle?: string;
  pageDescription?: string;
}

export default function AutoFixGenerator({ issueTitle, url, pageTitle, pageDescription }: AutoFixGeneratorProps) {
  const [visible, setVisible] = useState(false);

  // Placeholder — autofix generation can be wired later
  const snippet = useMemo(() => {
    if (!issueTitle) return '';
    return `<!-- Autofix suggestion for: ${issueTitle} -->\n<!-- URL: ${url} -->`;
  }, [issueTitle, url]);

  if (!snippet) return null;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-[11px]"
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Скрыть автофикс" : "Показать автофикс"}
      </Button>
      {visible && (
        <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] rounded-md border border-border/60 bg-card/60 px-3 py-2 font-mono">
          {snippet}
        </pre>
      )}
    </div>
  );
}
