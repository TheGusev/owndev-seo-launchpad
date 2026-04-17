import type { PreviewPayload } from '@/lib/api/siteFormula';
import { Badge } from '@/components/ui/badge';
import { Layers, AlertTriangle, Target, FileText } from 'lucide-react';

const CLASS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  start: { label: 'Start', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'Компактный проект' },
  growth: { label: 'Growth', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: 'Структурный рост' },
  scale: { label: 'Scale', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Масштабная архитектура' },
};

interface PreviewCardProps {
  payload: PreviewPayload;
}

export default function PreviewCard({ payload }: PreviewCardProps) {
  const cls = CLASS_LABELS[payload.project_class] || CLASS_LABELS.start;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Project Class */}
      <div className="text-center space-y-3">
        <Badge className={`text-lg px-4 py-2 ${cls.color} border font-bold`}>
          {cls.label}
        </Badge>
        <p className="text-muted-foreground max-w-md mx-auto">{payload.project_class_reason}</p>
      </div>

      {/* Page Count Estimate */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Оценка: {payload.page_count_estimate.min}–{payload.page_count_estimate.max} страниц</span>
      </div>

      {/* Key Layers */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <Layers className="h-4 w-4 text-primary" /> Ключевые слои архитектуры
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {payload.key_layers.map((layer) => (
            <div
              key={layer.id}
              className="rounded-lg border border-border bg-card p-3 space-y-1"
            >
              <p className="font-medium text-sm text-foreground">{layer.title}</p>
              <p className="text-xs text-muted-foreground">{layer.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      {payload.primary_risks.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" /> Основные риски
          </h3>
          <ul className="space-y-1">
            {payload.primary_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Reasons */}
      {payload.preview_reasons.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" /> Почему именно такая архитектура
          </h3>
          <ul className="space-y-1">
            {payload.preview_reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Derived Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(payload.derived_scores).map(([key, val]) => (
          <div key={key} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{val}</p>
            <p className="text-xs text-muted-foreground mt-1">{scoreName(key)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreName(key: string): string {
  const names: Record<string, string> = {
    indexation_safety: 'Безопасность индексации',
    scale_readiness: 'Готовность к масштабу',
    architectural_complexity: 'Сложность архитектуры',
    restructuring_risk: 'Риск реструктуризации',
  };
  return names[key] || key;
}
