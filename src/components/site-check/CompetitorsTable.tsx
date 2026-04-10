import { useMemo } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Competitor {
  _type: 'competitor';
  position: number;
  url: string;
  domain: string;
  title: string | null;
  h1: string | null;
  content_length_words: number;
  has_faq: boolean;
  has_price_block: boolean;
  has_reviews: boolean;
  has_schema: boolean;
  has_cta_button: boolean;
  has_video: boolean;
  has_blog: boolean;
  load_speed_sec: number | null;
  h2_count: number;
  h3_count: number;
  images_count: number;
  internal_links_count: number;
  top_phrases: string[];
  is_analyzed: boolean;
}

interface ComparisonTableData {
  _type: 'comparison_table';
  your_site: { content_length_words: number; h2_count: number; images_count: number; has_faq: boolean; has_price_block: boolean; has_reviews: boolean; has_schema: boolean; has_video: boolean };
  avg_top10: { content_length_words: number; h2_count: number; images_count: number; has_faq: boolean; has_price_block: boolean; has_reviews: boolean; has_schema: boolean; has_video: boolean };
  leader: { content_length_words: number; h2_count: number; images_count: number; has_faq: boolean; has_price_block: boolean; has_reviews: boolean; has_schema: boolean; has_video: boolean };
  leader_domain: string;
  insights: string[];
}

interface DirectMetaData {
  _type: 'direct_meta';
  query: string;
  region: string;
  serp_date: string;
  total_found: number;
}

interface CompetitorsTableProps {
  competitors: Competitor[];
  comparisonTable: ComparisonTableData | null;
  directMeta: DirectMetaData | null;
  userUrl?: string;
}

const EXCLUDE_DOMAINS = ['google.com','google.ru','yandex.ru','bing.com','wikipedia.org','wikipedia.ru','avito.ru','youla.ru','wildberries.ru','ozon.ru','youtube.com','vk.com','duckduckgo.com','mail.ru','ok.ru','2gis.ru','zoon.ru','yell.ru','flamp.ru','quora.com','stackexchange.com','rutube.ru'];

const CompetitorsTable = ({ competitors: rawCompetitors, comparisonTable: ct, directMeta }: CompetitorsTableProps) => {
  const competitors = useMemo(
      () => rawCompetitors.filter(c => c.domain && !EXCLUDE_DOMAINS.some(ex => c.domain.includes(ex))),    [rawCompetitors]
  );

  if (!competitors?.length) return null;

  return (
    <div className="space-y-4">
      {directMeta?.query && (
        <p className="text-xs text-muted-foreground">
          Запрос: {directMeta.query}{directMeta.region ? ` · ${directMeta.region}` : ''}
        </p>
      )}

      {/* Competitor chips */}
      <div className="flex flex-wrap gap-1.5">
        {competitors.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-1 rounded-md bg-muted/40 text-muted-foreground border border-border/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
          >
            {c.domain}
          </a>
        ))}
      </div>

      {/* Insights */}
      {ct?.insights && ct.insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            Что взять у конкурентов
          </h4>
          {ct.insights.map((insight, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-5">• {insight}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitorsTable;
