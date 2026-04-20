import React, { useState } from 'react';
import { Rocket, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoostItem {
  id: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  timeframe: string;
  category: 'technical' | 'content' | 'pr' | 'schema';
}

interface AiBoostSectionProps {
  items: BoostItem[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const categoryIcon: Record<string, string> = {
  technical: '🔧',
  content: '✍️',
  pr: '📣',
  schema: '📐',
};

const categoryLabel: Record<string, string> = {
  technical: 'Техника',
  content: 'Контент',
  pr: 'PR',
  schema: 'Schema',
};

const priorityClass: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-gray-500/20 text-gray-400',
};

const priorityLabel: Record<string, string> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const AiBoostSection = ({ items, loading, error, onRetry }: AiBoostSectionProps) => {
  const [filter, setFilter] = useState<string>('all');
  const [done, setDone] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const saved = localStorage.getItem('ai-boost-done');
    if (saved) {
      try { setDone(new Set(JSON.parse(saved))); } catch { /* noop */ }
    }
  }, []);

  const toggleDone = (id: string) => {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('ai-boost-done', JSON.stringify([...next]));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Генерируем персональный план...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Повторить
          </Button>
        )}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Rocket className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">План ещё не сгенерирован</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <Rocket className="w-3.5 h-3.5" /> Создать план
          </Button>
        )}
      </div>
    );
  }

  const filters = ['all', 'technical', 'content', 'pr', 'schema'];
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const doneCount = [...done].filter(id => items.some(i => i.id === id)).length;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-sm font-bold text-foreground">AI Boost — план попадания в нейросети</h2>
          <p className="text-xs text-muted-foreground">Персональные рекомендации на основе аудита</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {f === 'all' ? 'Все' : `${categoryIcon[f]} ${categoryLabel[f]}`}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div className="space-y-2">
        {filtered.map((item, idx) => {
          const isDone = done.has(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-xl border border-border p-3 transition-opacity ${isDone ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityClass[item.priority]}`}>
                      {priorityLabel[item.priority]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {categoryIcon[item.category]} {categoryLabel[item.category]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">⏱ {item.timeframe}</span>
                  </div>
                  <p className={`text-sm text-foreground ${isDone ? 'line-through' : ''}`}>
                    {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.impact}</p>
                </div>
                <button
                  onClick={() => toggleDone(item.id)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone ? 'bg-green-500 border-green-500' : 'border-border hover:border-primary'
                  }`}
                  aria-label="Отметить как выполненное"
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Прогресс */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Выполнено {doneCount} из {items.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default AiBoostSection;