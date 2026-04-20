import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { ScanMode } from "@/lib/site-check-types";
import { saveLastUrl } from "@/utils/lastUrl";
import { ymGoal } from "@/utils/analytics";
import { ensureProtocol } from "@/lib/api";

interface ScanFormProps {
  onSubmit: (url: string, mode: ScanMode) => void;
  isLoading?: boolean;
}

function isValidSiteUrl(input: string): boolean {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return (
      url.hostname.includes('.') &&
      url.hostname.length > 3 &&
      url.hostname !== 'localhost' &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)
    );
  } catch {
    return false;
  }
}

const ScanForm = ({ onSubmit, isLoading }: ScanFormProps) => {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    const savedUrl = localStorage.getItem("owndev_last_url");
    if (paramUrl) setUrl(paramUrl);
    else if (savedUrl) setUrl(savedUrl);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Введите адрес сайта');
      return;
    }
    if (!isValidSiteUrl(trimmed)) {
      setError('Введите корректный адрес сайта, например: example.ru или https://example.ru');
      return;
    }
    setError(null);
    const cleanUrl = ensureProtocol(url);
    saveLastUrl(cleanUrl);
    ymGoal("scan_started");
    onSubmit(cleanUrl, "site");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="ваш-сайт.ru"
          aria-label="URL сайта для проверки"
          className="pl-11 h-13 text-base bg-muted/50 border-border/50 focus:border-primary/50"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={!url.trim() || isLoading}
      >
        {isLoading ? "Проверяем..." : "Запустить GEO‑аудит"}
      </Button>
    </form>
  );
};

export default ScanForm;
