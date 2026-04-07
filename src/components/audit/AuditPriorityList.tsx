import { AlertTriangle, Clock, Lightbulb } from "lucide-react";
import type { AuditIssue } from "@/lib/api/types";

interface AuditPriorityListProps {
  issues: AuditIssue[];
}

const groups = [
  { priority: "P1", label: "Сделать сейчас", icon: AlertTriangle, color: "text-destructive", border: "border-destructive/30" },
  { priority: "P2", label: "В ближайший спринт", icon: Clock, color: "text-warning", border: "border-warning/30" },
  { priority: "P3", label: "По мере возможности", icon: Lightbulb, color: "text-muted-foreground", border: "border-border" },
] as const;

const AuditPriorityList = ({ issues }: AuditPriorityListProps) => {
  const byPriority = (p: string) => issues.filter((i) => (i.priority ?? "P3") === p);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Приоритеты</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groups.map(({ priority, label, icon: Icon, color, border }) => {
          const items = byPriority(priority);
          return (
            <div key={priority} className={`glass rounded-xl p-4 border ${border}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`text-xs font-semibold ${color}`}>{label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
              </div>
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground">Нет задач</p>
              )}
              {items.slice(0, 5).map((item, i) => (
                <p key={i} className="text-xs text-foreground truncate">• {item.message}</p>
              ))}
              {items.length > 5 && (
                <p className="text-[10px] text-muted-foreground mt-1">+{items.length - 5} ещё</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditPriorityList;
