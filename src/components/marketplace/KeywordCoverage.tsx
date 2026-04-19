import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import type { KeywordsBlock } from '@/lib/marketplace-audit-types';

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}

export default function KeywordCoverage({ keywords }: { keywords: KeywordsBlock | Record<string, never> }) {
  const k = keywords as KeywordsBlock;
  const coveredCount = k?.covered?.length ?? 0;
  const missingCount = k?.missing?.length ?? 0;
  if (coveredCount + missingCount === 0) return null;

  const pct = Math.max(0, Math.min(100, k.coveragePct ?? 0));
  const source = (k as any).source as 'llm' | 'naive' | undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Покрытие ключевых слов — {pct}%</h2>
        {source === 'llm' && (
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> AI-анализ ниши
          </Badge>
        )}
      </div>

      <Card className="p-5 space-y-4">
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
            aria-label={`${pct}% покрытие`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-primary">Найдены в карточке ({coveredCount})</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {k.covered?.map((w) => (
                <Badge key={w} variant="secondary">
                  {w}
                </Badge>
              ))}
              {coveredCount === 0 && <p className="text-xs text-muted-foreground">Пока пусто</p>}
            </div>
          </div>
          <div>
            <Label className="text-destructive">Отсутствуют ({missingCount})</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {k.missing?.map((w) => (
                <Badge key={w} variant="outline">
                  {w}
                </Badge>
              ))}
              {missingCount === 0 && (
                <p className="text-xs text-muted-foreground">Все ключи покрыты</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
