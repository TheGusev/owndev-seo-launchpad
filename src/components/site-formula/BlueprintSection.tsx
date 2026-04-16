import type { ReportSection } from '@/lib/api/siteFormula';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BlueprintSectionProps {
  section: ReportSection;
  defaultOpen?: boolean;
}

export default function BlueprintSection({ section, defaultOpen = false }: BlueprintSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <h3 className="font-semibold text-foreground text-left">{section.title}</h3>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {Object.entries(section.content).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {formatFieldName(key)}
              </p>
              {renderValue(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ');
}

function renderValue(value: any): JSX.Element {
  if (typeof value === 'string') {
    return <p className="text-sm text-foreground">{value}</p>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="grid gap-1 text-sm">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="font-medium text-muted-foreground">{k}:</span>
            <span className="text-foreground">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground">{String(value)}</p>;
}
