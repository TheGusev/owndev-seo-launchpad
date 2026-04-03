import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Keyword {
  keyword: string;
  volume: number;
  cluster: string;
  intent?: string;
  landing_needed?: boolean;
}

interface KeywordsSectionProps {
  keywords: Keyword[];
}

const intentLabels: Record<string, string> = {
  transactional: "Транзакц.",
  informational: "Информац.",
  navigational: "Навигац.",
  commercial: "Коммерч.",
};

const intentColors: Record<string, string> = {
  transactional: "bg-green-500/10 text-green-500 border-green-500/20",
  informational: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  navigational: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  commercial: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const ALL_INTENTS = ["transactional", "informational", "navigational", "commercial"];

const KeywordsSection = ({ keywords }: KeywordsSectionProps) => {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const allClusters = useMemo(() => [...new Set(keywords.map(k => k.cluster))], [keywords]);

  const filtered = useMemo(() => {
    let result = keywords;
    if (activeCluster) result = result.filter(k => k.cluster === activeCluster);
    if (activeIntent) result = result.filter(k => k.intent === activeIntent);
    return result;
  }, [keywords, activeCluster, activeIntent]);

  const clusters = useMemo(() => [...new Set(filtered.map(k => k.cluster))], [filtered]);

  if (!keywords?.length) return null;

  return (
    <div className="space-y-3">
      {/* Filters — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <Badge variant={activeCluster === null ? "default" : "outline"} className="cursor-pointer shrink-0 text-xs" onClick={() => setActiveCluster(null)}>
          Все
        </Badge>
        {allClusters.map(c => (
          <Badge key={c} variant={activeCluster === c ? "default" : "outline"} className="cursor-pointer shrink-0 text-xs" onClick={() => setActiveCluster(activeCluster === c ? null : c)}>
            {c}
          </Badge>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <Badge variant={activeIntent === null ? "default" : "outline"} className="cursor-pointer shrink-0 text-xs" onClick={() => setActiveIntent(null)}>
          Все
        </Badge>
        {ALL_INTENTS.map(intent => (
          <Badge
            key={intent}
            variant={activeIntent === intent ? "default" : "outline"}
            className={`cursor-pointer shrink-0 text-xs ${activeIntent === intent ? "" : intentColors[intent] || ""}`}
            onClick={() => setActiveIntent(activeIntent === intent ? null : intent)}
          >
            {intentLabels[intent]}
          </Badge>
        ))}
      </div>

      {/* Cluster sub-accordions */}
      {clusters.map(cluster => {
        const clusterKw = filtered.filter(k => k.cluster === cluster);
        const isOpen = expandedCluster === cluster;
        const shown = isOpen ? clusterKw : clusterKw.slice(0, 10);
        const hasMore = clusterKw.length > 10 && !isOpen;

        return (
          <div key={cluster} className="space-y-1">
            <button
              onClick={() => setExpandedCluster(expandedCluster === cluster ? null : cluster)}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 w-full text-left"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              {cluster} <span className="text-muted-foreground font-normal text-xs">({clusterKw.length})</span>
            </button>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Запрос</th>
                    <th className="text-right py-1.5 px-2 font-medium text-muted-foreground w-16">Частота</th>
                    <th className="text-left py-1.5 font-medium text-muted-foreground w-24">Интент</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((kw, i) => (
                    <tr key={i} className="border-b border-border/10">
                      <td className="py-1 text-foreground">{kw.keyword}</td>
                      <td className="py-1 px-2 text-right text-muted-foreground">{kw.volume?.toLocaleString("ru-RU") ?? "—"}</td>
                      <td className="py-1">
                        {kw.intent && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${intentColors[kw.intent] || "bg-muted text-muted-foreground"}`}>
                            {intentLabels[kw.intent] || kw.intent}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <button
                onClick={() => setExpandedCluster(cluster)}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Ещё +{clusterKw.length - 10}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KeywordsSection;
