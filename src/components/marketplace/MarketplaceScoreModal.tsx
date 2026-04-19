import { useEffect, useCallback } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BreakdownJson } from '@/lib/marketplace-audit-types';

export type ScoreType = 'total' | 'content' | 'search' | 'conversion' | 'ads';

interface Props {
  type: ScoreType;
  score: number;
  breakdown?: BreakdownJson;
  scores?: { content: number; search: number; conversion: number; ads: number; total: number };
  onClose: () => void;
}

const TYPE_LABELS: Record<ScoreType, string> = {
  total: 'Общий',
  content: 'Контент',
  search: 'Поиск',
  conversion: 'Конверсия',
  ads: 'Реклама',
};

const WEIGHTS = { content: 0.30, search: 0.30, conversion: 0.25, ads: 0.15 };

function getScoreBadge(score: number) {
  if (score >= 80) return { cls: 'bg-success/20 text-success', label: 'Отлично' };
  if (score >= 50) return { cls: 'bg-warning/20 text-warning', label: 'Средне' };
  return { cls: 'bg-destructive/20 text-destructive', label: 'Критично' };
}

function getStatus(score: number): 'pass' | 'partial' | 'fail' {
  if (score >= 80) return 'pass';
  if (score >= 50) return 'partial';
  return 'fail';
}

const StatusIcon = ({ status }: { status: 'pass' | 'partial' | 'fail' }) => {
  if (status === 'pass') return <Check className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'partial') return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
  return <X className="w-3.5 h-3.5 text-red-500" />;
};

const TotalFormula = ({ scores }: { scores: Props['scores'] }) => {
  if (!scores) return null;
  const components = [
    { label: 'Контент', weight: WEIGHTS.content, value: scores.content },
    { label: 'Поиск', weight: WEIGHTS.search, value: scores.search },
    { label: 'Конверсия', weight: WEIGHTS.conversion, value: scores.conversion },
    { label: 'Реклама', weight: WEIGHTS.ads, value: scores.ads },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Total = взвешенная комбинация 4 модулей карточки.
      </p>
      <div className="space-y-2">
        {components.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">{c.label} × {(c.weight * 100).toFixed(0)}%</span>
            <span className="font-mono font-semibold">
              {Math.round(c.value)} × {c.weight} ={' '}
              <span className="text-foreground">{(c.value * c.weight).toFixed(1)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border/30 pt-2 flex items-center justify-between text-sm font-semibold">
        <span>Итого</span>
        <span className="font-mono">
          {Math.round(components.reduce((s, c) => s + c.value * c.weight, 0))}/100
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Формула: 0.30·Content + 0.30·Search + 0.25·Conversion + 0.15·AdReadiness
      </p>
    </div>
  );
};

export default function MarketplaceScoreModal({ type, score, breakdown, scores, onClose }: Props) {
  const isMobile = useIsMobile();

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [handleEsc]);

  const isTotal = type === 'total';
  const sub = !isTotal && breakdown ? breakdown[type] : undefined;
  const badge = getScoreBadge(score);

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/60" onClick={onClose} />
      <div
        className={`fixed z-[1000] bg-card border border-border/50 ${
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh] animate-in slide-in-from-bottom duration-200'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[80vh] rounded-2xl'
        } overflow-y-auto p-5 md:p-6`}
      >
        {isMobile && <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground">
              {TYPE_LABELS[type]} — {Math.round(score)}/100
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Закрыть">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {isTotal ? (
          scores ? <TotalFormula scores={scores} /> : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Детальная разбивка недоступна.
            </p>
          )
        ) : sub && sub.factors?.length ? (
          <>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Фактор</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-12">Вес</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-12">Балл</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sub.factors.map((f, i) => {
                  const status = getStatus(f.score);
                  return (
                    <tr key={i} className="border-b border-border/10 align-top">
                      <td className="py-2 px-1">
                        <span className="font-medium text-foreground">{f.name}</span>
                        {f.reason && (
                          <span className="block text-muted-foreground text-[11px] mt-0.5">{f.reason}</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-1 text-muted-foreground">
                        {Math.round((f.weight ?? 0) * 100)}%
                      </td>
                      <td className="text-center py-2 px-1 font-semibold">
                        <span className={
                          status === 'pass' ? 'text-emerald-500' :
                          status === 'partial' ? 'text-yellow-500' : 'text-red-500'
                        }>
                          {Math.round(f.score)}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <StatusIcon status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sub.missingData?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Недостаточно данных:</p>
                <div className="flex flex-wrap gap-1.5">
                  {sub.missingData.map((m, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Детальная разбивка недоступна для этого модуля.
          </p>
        )}
      </div>
    </>
  );
}
