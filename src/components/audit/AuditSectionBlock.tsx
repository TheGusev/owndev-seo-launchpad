import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Construction } from "lucide-react";
import AuditIssueRow from "./AuditIssueRow";
import type { AuditIssue } from "@/lib/api/types";

export interface SectionConfig {
  id: string;
  label: string;
  categories: string[];
  whyImportant?: string;
  comingSoon?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AuditSectionBlockProps {
  section: SectionConfig;
  issues: AuditIssue[];
  confidence?: number;
}

const getStatus = (issues: AuditIssue[]) => {
  if (issues.some((i) => i.severity === "critical" || i.priority === "P1")) return "critical";
  if (issues.some((i) => i.severity === "warning" || i.priority === "P2")) return "warning";
  return "ok";
};

const statusConfig = {
  ok: { icon: CheckCircle, label: "OK", cls: "text-success bg-success/10 border-success/30" },
  warning: { icon: AlertTriangle, label: "Warning", cls: "text-warning bg-warning/10 border-warning/30" },
  critical: { icon: XCircle, label: "Critical", cls: "text-destructive bg-destructive/10 border-destructive/30" },
};

const AuditSectionBlock = ({ section, issues, confidence }: AuditSectionBlockProps) => {
  if (section.comingSoon) {
    return (
      <div className="glass rounded-xl p-4 flex items-center gap-3 opacity-60">
        <Construction className="w-4 h-4 text-muted-foreground" />
        {section.icon && <section.icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-foreground">{section.label}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">В разработке</Badge>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-4 h-4 text-success" />
        {section.icon && <section.icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-foreground">{section.label}</span>
        <Badge className="ml-auto text-[10px] bg-success/10 text-success border border-success/30">OK</Badge>
      </div>
    );
  }

  const status = getStatus(issues);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={section.id} className="border-none">
        <AccordionTrigger className="glass rounded-xl px-4 py-3 hover:no-underline [&[data-state=open]]:rounded-b-none">
          <div className="flex items-center gap-3 flex-1">
            <StatusIcon className={`w-4 h-4 ${cfg.cls.split(" ")[0]}`} />
            {section.icon && <section.icon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground">{section.label}</span>
            <Badge className={`ml-auto text-[10px] border ${cfg.cls}`}>{cfg.label} · {issues.length}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="glass rounded-b-xl border-t border-border/20 px-4 pb-4 pt-3">
          {section.whyImportant && (
            <p className="text-xs text-muted-foreground mb-3 italic">💡 {section.whyImportant}</p>
          )}
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <AuditIssueRow key={i} issue={issue} confidence={confidence} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AuditSectionBlock;
