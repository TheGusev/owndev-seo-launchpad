import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketplaceIssue } from '@/lib/marketplace-audit-types';

export default function IssuesByImpact({ issues }: { issues: MarketplaceIssue[] }) {
  if (!issues?.length) return null;
  const top = [...issues].sort((a, b) => b.impact_score - a.impact_score).slice(0, 8);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Что мешает росту</h2>
      <div className="space-y-3">
        {top.map((issue) => (
          <Card key={issue.id} className="p-4">
            <div className="flex items-start gap-3">
              <Badge
                variant={
                  issue.severity === 'critical' || issue.severity === 'high'
                    ? 'destructive'
                    : 'secondary'
                }
                className="shrink-0"
              >
                {issue.severity}
              </Badge>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{issue.title}</h3>
                {issue.found && (
                  <p className="text-xs text-muted-foreground mb-2">Найдено: {issue.found}</p>
                )}
                {issue.why_it_matters && (
                  <p className="text-sm text-muted-foreground mb-2">{issue.why_it_matters}</p>
                )}
                {issue.how_to_fix && (
                  <p className="text-sm">
                    <span className="text-primary font-medium">Что делать: </span>
                    {issue.how_to_fix}
                  </p>
                )}
                {issue.example_fix && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Пример: {issue.example_fix}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
