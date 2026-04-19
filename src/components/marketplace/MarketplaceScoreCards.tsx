import { Card } from '@/components/ui/card';
import type { ScoresJson } from '@/lib/marketplace-audit-types';

function ScoreCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'primary';
}) {
  const color =
    value >= 80
      ? 'text-primary'
      : value >= 60
      ? 'text-foreground'
      : value >= 40
      ? 'text-muted-foreground'
      : 'text-destructive';
  return (
    <Card className={`p-5 ${tone === 'primary' ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>
        {value}
        <span className="text-base text-muted-foreground">/100</span>
      </div>
    </Card>
  );
}

export default function MarketplaceScoreCards({ scores }: { scores: ScoresJson }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Оценка карточки</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ScoreCard label="Total" value={scores.total} tone="primary" />
        <ScoreCard label="Контент" value={scores.content} />
        <ScoreCard label="Поиск" value={scores.search} />
        <ScoreCard label="Конверсия" value={scores.conversion} />
        <ScoreCard label="Реклама" value={scores.ads} />
      </div>
    </div>
  );
}
