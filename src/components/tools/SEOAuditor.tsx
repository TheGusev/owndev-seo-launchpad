import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Search, Loader2 } from "lucide-react";
import { auditSite } from "@/lib/api";
import ToolCTA from "./ToolCTA";
import { saveLastUrl } from "@/utils/lastUrl";
import { useAudit } from "@/state/audit";
import { AuditResultView } from "@/components/audit";
import type { AuditResult as UnifiedResult } from "@/lib/api/types";

interface LocalAuditIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
  category: "seo" | "llm";
  details?: string[];
  context?: string;
}

interface LocalAuditResult {
  seoScore: number;
  llmScore: number;
  issues: LocalAuditIssue[];
  summary: string;
  meta: Record<string, any>;
}

const categoryMap: Record<string, string> = {
  seo: "technical",
  llm: "ai",
};

const severityToPriority = (s: string) =>
  s === "critical" ? "P1" as const : s === "warning" ? "P2" as const : "P3" as const;

const normalizeResult = (r: LocalAuditResult): UnifiedResult => ({
  score: Math.round((r.seoScore + r.llmScore) / 2),
  confidence: (r as any).confidence ?? 75,
  summary: r.summary,
  issues: r.issues.map((i) => ({
    type: i.type,
    severity: i.severity,
    message: i.message,
    detail: i.recommendation,
    category: categoryMap[i.category] ?? i.category,
    recommendation: i.recommendation,
    priority: (i as any).priority || severityToPriority(i.severity),
  })),
  meta: r.meta,
});

const SEOAuditor = () => {
  const [url, setUrl] = useState("");
  const { run, current } = useAudit<LocalAuditResult>("seo-audit");

  const loading = current?.loading ?? false;
  const error = current?.error ?? null;
  const rawResult = (current?.result as LocalAuditResult) ?? null;
  const normalizedResult = rawResult ? normalizeResult(rawResult) : null;

  const runAudit = async () => {
    if (!url.trim()) return;
    try {
      await run(url.trim(), () => auditSite(url.trim(), { toolId: 'seo-audit' }));
      saveLastUrl(url.trim());
    } catch {
      // error stored in audit state
    }
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL сайта для аудита</label>
          <div className="flex gap-3">
            <Input
              placeholder="https://example.com"
              className="bg-card border-border flex-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAudit()}
            />
            <GradientButton onClick={runAudit} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </GradientButton>
          </div>
        </div>

        <AuditResultView
          result={normalizedResult}
          isLoading={loading}
          error={error}
          toolId="seo-audit"
          url={url}
          onRetry={runAudit}
        />

        {normalizedResult && <ToolCTA />}
      </div>
    </div>
  );
};

export default SEOAuditor;
