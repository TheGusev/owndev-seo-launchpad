import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  transactional: "Транзакционный",
  informational: "Информационный",
  navigational: "Навигационный",
  commercial: "Коммерческий",
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

  if (!keywords || keywords.length === 0) return null;

  const allClusters = useMemo(
    () => [...new Set(keywords.map((k) => k.cluster))],
    [keywords]
  );

  const filtered = useMemo(() => {
    let result = keywords;
    if (activeCluster) result = result.filter((k) => k.cluster === activeCluster);
    if (activeIntent) result = result.filter((k) => k.intent === activeIntent);
    return result;
  }, [keywords, activeCluster, activeIntent]);

  const clusters = useMemo(
    () => [...new Set(filtered.map((k) => k.cluster))],
    [filtered]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        Ключевые запросы{" "}
        <span className="text-muted-foreground font-normal text-base">
          {filtered.length === keywords.length
            ? `(${keywords.length})`
            : `(${filtered.length} из ${keywords.length})`}
        </span>
      </h2>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={activeCluster === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCluster(null)}
          >
            Все кластеры
          </Badge>
          {allClusters.map((c) => (
            <Badge
              key={c}
              variant={activeCluster === c ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCluster(activeCluster === c ? null : c)}
            >
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={activeIntent === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveIntent(null)}
          >
            Все интенты
          </Badge>
          {ALL_INTENTS.map((intent) => (
            <Badge
              key={intent}
              variant={activeIntent === intent ? "default" : "outline"}
              className={`cursor-pointer ${activeIntent === intent ? "" : intentColors[intent] || ""}`}
              onClick={() => setActiveIntent(activeIntent === intent ? null : intent)}
            >
              {intentLabels[intent]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tables grouped by cluster */}
      {clusters.map((cluster) => {
        const clusterKeywords = filtered.filter((k) => k.cluster === cluster);
        return (
          <div key={cluster} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/80">
              {cluster}{" "}
              <span className="text-muted-foreground font-normal">
                ({clusterKeywords.length})
              </span>
            </h3>
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Запрос</TableHead>
                    <TableHead className="w-24 text-right">Частота</TableHead>
                    <TableHead className="w-32">Интент</TableHead>
                    <TableHead className="w-20 text-center">Страница</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusterKeywords.map((kw, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-foreground">
                        {kw.keyword}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {kw.volume?.toLocaleString("ru-RU") ?? "—"}
                      </TableCell>
                      <TableCell>
                        {kw.intent && (
                          <Badge
                            variant="outline"
                            className={intentColors[kw.intent] || ""}
                          >
                            {intentLabels[kw.intent] || kw.intent}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {kw.landing_needed && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                            Нужна
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KeywordsSection;
