import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Plus } from 'lucide-react';
import type { CompetitorsField } from '@/lib/marketplace-audit-types';

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}

export default function CompetitorGap({ competitors }: { competitors: CompetitorsField }) {
  // Normalize: legacy array OR new {list, gap}
  const list = Array.isArray(competitors) ? competitors : competitors?.list ?? [];
  const gap = Array.isArray(competitors) ? null : competitors?.gap ?? null;

  if (!gap && list.length === 0) return null;

  const hasGap = !!gap && (gap.weakerThan?.length || gap.strongerThan?.length || gap.priorityAdds?.length);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Отрыв от конкурентов</h2>

      {!hasGap && list.length > 0 && (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground mb-3">
            Анализ относительно указанных конкурентов:
          </p>
          <div className="flex flex-col gap-2">
            {list.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate"
              >
                {c.title || c.url}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Подробный gap-анализ появится в полной версии аудита.
          </p>
        </Card>
      )}

      {hasGap && gap && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gap.weakerThan?.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <Label className="text-destructive">Где мы слабее</Label>
              </div>
              <ul className="space-y-2 text-sm">
                {gap.weakerThan.map((g, i) => (
                  <li key={i}>
                    <span className="font-medium">{g.aspect}:</span>{' '}
                    <span className="text-muted-foreground">{g.evidence}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {gap.strongerThan?.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <Label className="text-primary">Где мы сильнее</Label>
              </div>
              <ul className="space-y-2 text-sm">
                {gap.strongerThan.map((g, i) => (
                  <li key={i}>
                    <span className="font-medium">{g.aspect}:</span>{' '}
                    <span className="text-muted-foreground">{g.evidence}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {gap.priorityAdds?.length > 0 && (
            <Card className="p-5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-primary" />
                <Label>Что добавить в первую очередь</Label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gap.priorityAdds.map((p, i) => (
                  <Badge key={i} variant="outline">
                    {p}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
