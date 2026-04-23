import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import type { ScanMode } from "@/lib/site-check-types";
import { saveLastUrl } from "@/utils/lastUrl";
import { ymGoal } from "@/utils/analytics";
import { ensureProtocol } from "@/lib/api";
import { getHistory } from "@/utils/scanHistory";

interface ScanFormProps {
  onSubmit: (url: string, mode: ScanMode, force?: boolean) => void;
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
  const [force, setForce] = useState(false);

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    const savedUrl = localStorage.getItem("owndev_last_url");
    if (paramUrl) setUrl(paramUrl);
    else if (savedUrl) setUrl(savedUrl);
  }, [searchParams]);

  // Show "force rescan" toggle only if this URL was scanned recently (last hour).
  const recentlyScanned = (() => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const host = new URL(ensureProtocol(trimmed)).hostname.toLowerCase();
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return getHistory().some((h) => {
        try {
          const hHost = new URL(ensureProtocol(h.url)).hostname.toLowerCase();
          return hHost === host && new Date(h.date).getTime() > hourAgo;
        } catch { return false; }
      });
    } catch { return false; }
  })();

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
    onSubmit(cleanUrl, "site", force);
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

      {recentlyScanned && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
            disabled={isLoading}
          />
          <RefreshCw className="w-3.5 h-3.5 text-primary/70" />
          <span>Пересканировать заново (игнорировать кэш)</span>
        </label>
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
