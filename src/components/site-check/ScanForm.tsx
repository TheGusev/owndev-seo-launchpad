import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Zap } from "lucide-react";
import type { ScanMode } from "@/lib/site-check-types";
import { saveLastUrl } from "@/utils/lastUrl";
import { ymGoal } from "@/utils/analytics";
import { ensureProtocol } from "@/lib/api";

interface ScanFormProps {
  onSubmit: (url: string, mode: ScanMode, scanMode: 'basic' | 'full') => void;
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

  const handleSubmit = (scanMode: 'basic' | 'full') => {
    if (!url.trim()) return;
    const cleanUrl = ensureProtocol(url);
    saveLastUrl(cleanUrl);
    ymGoal("scan_started");
    onSubmit(cleanUrl, "site", scanMode);
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ваш-сайт.ru"
          aria-label="URL сайта для проверки"
          className="pl-11 h-13 text-base bg-muted/50 border-border/50 focus:border-primary/50"
          disabled={isLoading}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit('full'); } }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="hero"
          size="lg"
          className="flex-1 gap-2"
          disabled={!url.trim() || isLoading}
          onClick={() => handleSubmit('full')}
        >
          <Zap className="w-4 h-4" />
          {isLoading ? "Проверяем..." : "Полный GEO‑аудит"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={!url.trim() || isLoading}
          onClick={() => handleSubmit('basic')}
        >
          {isLoading ? "Проверяем..." : "Быстрая проверка"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Полный аудит включает ключевые слова, конкурентов и Яндекс.Директ
      </p>
    </div>
  );
};

export default ScanForm;
