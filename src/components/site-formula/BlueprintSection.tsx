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
        className="flex w-full items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors"
      >
        <h3 className="font-semibold text-foreground text-left text-sm sm:text-base pr-2">{section.title}</h3>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border p-3 sm:p-4 space-y-4 overflow-x-auto">
          {Object.entries(section.content).map(([key, value]) => (
            <div key={key} className="space-y-1 min-w-0">
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
    return <p className="text-sm text-foreground break-words">{value}</p>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground break-words">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span className="min-w-0">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="grid gap-1 text-sm">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex flex-col sm:flex-row gap-0 sm:gap-2 break-words">
            <span className="font-medium text-muted-foreground shrink-0">{k}:</span>
            <span className="text-foreground min-w-0">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground break-words">{String(value)}</p>;
}
