import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import IssueCardComponent from "./IssueCard";
import { useIssueTracker } from "@/hooks/useIssueTracker";
import { useToast } from "@/hooks/use-toast";
import type { IssueCard, IssueModule } from "@/lib/site-check-types";

const moduleOrder: { key: IssueModule; label: string }[] = [
  { key: "technical", label: "Техника" },
  { key: "content", label: "Контент" },
  { key: "direct", label: "Яндекс.Директ" },
  { key: "competitors", label: "Конкуренты" },
  { key: "semantics", label: "Семантика" },
  { key: "schema", label: "Schema.org" },
  { key: "ai", label: "AI-видимость" },
];

interface FullReportViewProps {
  issues: IssueCard[];
  url: string;
}

const FullReportView = ({ issues, url }: FullReportViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedIds, toggleIssue, resolvedCount } = useIssueTracker(url);
  const toastShownRef = useRef(false);

  const totalCount = issues.length;
  const percent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const clampedPercent = Math.min(percent, 100);

  useEffect(() => {
    if (clampedPercent >= 100 && totalCount > 0 && !toastShownRef.current) {
      toastShownRef.current = true;
      toast({
        title: "Отличная работа! 🎉",
        description: "Запустите проверку заново, чтобы обновить баллы.",
      });
    }
  }, [clampedPercent, totalCount, toast]);

  const grouped = moduleOrder
    .map((m) => ({
      ...m,
      items: issues.filter((i) => i.module === m.key),
    }))
    .filter((m) => m.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">План исправления сайта</h3>
          <span className="text-xs text-muted-foreground">
            Исправлено: {Math.min(resolvedCount, totalCount)} из {totalCount}
          </span>
        </div>
        <Progress value={clampedPercent} className="h-2" />
      </div>

      <Accordion type="multiple" defaultValue={grouped.map((g) => g.key)} className="space-y-3">
        {grouped.map((group) => (
          <AccordionItem key={group.key} value={group.key} className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-semibold">
              {group.label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({group.items.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {group.items.map((issue) => (
                <IssueCardComponent
                  key={issue.id}
                  issue={issue}
                  resolved={resolvedIds.includes(issue.id)}
                  onToggle={() => toggleIssue(issue.id)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {resolvedCount > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/tools/site-check?url=${encodeURIComponent(url)}&rescan=true`)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить результаты (Пересканировать)
          </Button>
        </div>
      )}
    </div>
  );
};

export default FullReportView;
