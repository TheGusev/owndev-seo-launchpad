import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { ScoresJson } from '@/lib/marketplace-audit-types';
import MarketplaceScoreModal, { type ScoreType } from './MarketplaceScoreModal';

function ScoreCard({
  label,
  value,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'primary';
  onClick: () => void;
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
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
        tone === 'primary' ? 'border-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>
        {Math.round(value)}
        <span className="text-base text-muted-foreground">/100</span>
      </div>
    </Card>
  );
}

export default function MarketplaceScoreCards({ scores }: { scores: ScoresJson }) {
  const [openType, setOpenType] = useState<ScoreType | null>(null);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Оценка карточки</h2>
        <span className="text-xs text-muted-foreground">Нажми на карточку — увидишь, как рассчитано</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ScoreCard label="Total" value={scores.total} tone="primary" onClick={() => setOpenType('total')} />
        <ScoreCard label="Контент" value={scores.content} onClick={() => setOpenType('content')} />
        <ScoreCard label="Поиск" value={scores.search} onClick={() => setOpenType('search')} />
        <ScoreCard label="Конверсия" value={scores.conversion} onClick={() => setOpenType('conversion')} />
        <ScoreCard label="Реклама" value={scores.ads} onClick={() => setOpenType('ads')} />
      </div>

      {openType && (
        <MarketplaceScoreModal
          type={openType}
          score={
            openType === 'total' ? scores.total :
            openType === 'content' ? scores.content :
            openType === 'search' ? scores.search :
            openType === 'conversion' ? scores.conversion :
            scores.ads
          }
          breakdown={scores.breakdown}
          scores={{
            total: scores.total,
            content: scores.content,
            search: scores.search,
            conversion: scores.conversion,
            ads: scores.ads,
          }}
          onClose={() => setOpenType(null)}
        />
      )}
    </div>
  );
}
