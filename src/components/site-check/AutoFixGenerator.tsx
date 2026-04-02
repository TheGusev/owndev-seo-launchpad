import { useState } from "react";
import { Wand2, Copy, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { autoFixTemplates, matchIssueToTemplate } from "@/utils/autoFixTemplates";
import { useToast } from "@/hooks/use-toast";

interface AutoFixGeneratorProps {
  issueTitle: string;
  url: string;
  pageTitle?: string;
  pageDescription?: string;
}

const AutoFixGenerator = ({ issueTitle, url, pageTitle, pageDescription }: AutoFixGeneratorProps) => {
  const [fixCode, setFixCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const templateKey = matchIssueToTemplate(issueTitle);

  // Don't render if no template matches
  if (!templateKey) return null;

  const handleGenerate = async () => {
    if (fixCode) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setExpanded(true);

    // Try AI generation first
    try {
      const { data, error } = await supabase.functions.invoke("generate-autofix", {
        body: { issueType: templateKey, url, title: pageTitle, description: pageDescription },
      });

      if (!error && data?.code) {
        setFixCode(data.code);
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to template
    }

    // Fallback: use static template
    const template = autoFixTemplates[templateKey];
    if (template) {
      setFixCode(
        template({
          url,
          title: pageTitle || "",
          description: pageDescription || "",
          suggestedDescription: pageDescription || "",
          suggestedTitle: pageTitle || "",
          suggestedH1: pageTitle || "",
          siteName: "",
        })
      );
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!fixCode) return;
    await navigator.clipboard.writeText(fixCode);
    setCopied(true);
    toast({ title: "Код скопирован!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 active:text-primary/80 transition-colors min-h-[36px]"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Wand2 className="w-3.5 h-3.5" />
        )}
        {fixCode ? (expanded ? "Скрыть код" : "Показать код") : "Получить код исправления"}
        {fixCode && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {expanded && fixCode && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20 bg-muted/20">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {templateKey.includes("llms") ? "TXT" : templateKey.includes("robots") || templateKey.includes("sitemap") ? "XML" : "HTML"}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <pre className="p-3 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-64 text-foreground/80 font-mono">
            {fixCode}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AutoFixGenerator;
