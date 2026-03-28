import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import IssueCardComponent from "./IssueCard";
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
}

const FullReportView = ({ issues }: FullReportViewProps) => {
  const grouped = moduleOrder
    .map((m) => ({
      ...m,
      items: issues.filter((i) => i.module === m.key),
    }))
    .filter((m) => m.items.length > 0);

  return (
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
              <IssueCardComponent key={issue.id} issue={issue} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FullReportView;
