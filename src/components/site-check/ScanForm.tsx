import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Globe, FileText } from "lucide-react";
import type { ScanMode } from "@/lib/site-check-types";
import { saveLastUrl } from "@/utils/lastUrl";
import { ymGoal } from "@/utils/analytics";

interface ScanFormProps {
  onSubmit: (url: string, mode: ScanMode) => void;
  isLoading?: boolean;
}

const ScanForm = ({ onSubmit, isLoading }: ScanFormProps) => {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState("");

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    const savedUrl = localStorage.getItem("owndev_last_url");
    if (paramUrl) setUrl(paramUrl);
    else if (savedUrl) setUrl(savedUrl);
  }, [searchParams]);
  const [mode, setMode] = useState<ScanMode>("page");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    saveLastUrl(cleanUrl);
    ymGoal("scan_started");
    onSubmit(cleanUrl, mode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://ваш-сайт.ru"
          aria-label="URL сайта для проверки"
          className="pl-11 h-13 text-base bg-muted/50 border-border/50 focus:border-primary/50"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("page")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            mode === "page"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Проверить страницу
        </button>
        <button
          type="button"
          onClick={() => setMode("site")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            mode === "site"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50"
          }`}
        >
          <Globe className="w-4 h-4" />
          Проверить сайт
        </button>
      </div>

      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={!url.trim() || isLoading}
      >
        {isLoading ? "Проверяем..." : "Запустить проверку"}
      </Button>
    </form>
  );
};

export default ScanForm;
