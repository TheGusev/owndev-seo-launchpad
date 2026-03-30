import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CompetitorScores {
  total: number;
  seo: number;
  direct: number;
  schema: number;
  ai: number;
}

interface Competitor {
  url: string;
  scores: CompetitorScores;
  title?: string;
  word_count?: number;
  has_faq?: boolean;
  has_reviews?: boolean;
  has_schema?: boolean;
  top_phrases?: string[];
}

interface CompetitorsTableProps {
  competitors: Competitor[];
  userUrl?: string;
  userScores?: CompetitorScores;
}

function scoreColor(val: number) {
  if (val >= 71) return "text-green-500";
  if (val >= 41) return "text-yellow-500";
  return "text-red-500";
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

const CompetitorsTable = ({ competitors, userUrl, userScores }: CompetitorsTableProps) => {
  if (!competitors || competitors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        Сравнение с конкурентами ({competitors.length})
      </h2>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {userScores && userUrl && (
          <div className="border-2 border-primary/30 rounded-xl p-4 space-y-2 bg-primary/5">
            <p className="text-sm font-bold text-primary truncate">
              ⭐ {shortenUrl(userUrl)}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Общий: <span className={scoreColor(userScores?.total ?? 0)}>{userScores?.total ?? 0}</span></div>
              <div>SEO: <span className={scoreColor(userScores?.seo ?? 0)}>{userScores?.seo ?? 0}</span></div>
              <div>Директ: <span className={scoreColor(userScores?.direct ?? 0)}>{userScores?.direct ?? 0}</span></div>
              <div>Schema: <span className={scoreColor(userScores?.schema ?? 0)}>{userScores?.schema ?? 0}</span></div>
            </div>
          </div>
        )}
        {competitors.map((c, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-foreground truncate">
              #{i + 1} {shortenUrl(c.url)}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Общий: <span className={scoreColor(c.scores?.total ?? 0)}>{c.scores?.total ?? 0}</span></div>
              <div>SEO: <span className={scoreColor(c.scores?.seo ?? 0)}>{c.scores?.seo ?? 0}</span></div>
              <div>Директ: <span className={scoreColor(c.scores?.direct ?? 0)}>{c.scores?.direct ?? 0}</span></div>
              <div>Schema: <span className={scoreColor(c.scores?.schema ?? 0)}>{c.scores?.schema ?? 0}</span></div>
            </div>
            {c.top_phrases && c.top_phrases.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Фразы: {c.top_phrases.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сайт</TableHead>
              <TableHead className="text-center w-20">Общий</TableHead>
              <TableHead className="text-center w-16">SEO</TableHead>
              <TableHead className="text-center w-16">Директ</TableHead>
              <TableHead className="text-center w-16">Schema</TableHead>
              <TableHead className="text-center w-16">AI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userScores && userUrl && (
              <TableRow className="bg-primary/5 border-primary/20">
                <TableCell className="font-bold text-primary truncate max-w-[200px]">
                  ⭐ {shortenUrl(userUrl)}
                </TableCell>
                <TableCell className={`text-center font-bold ${scoreColor(userScores?.total ?? 0)}`}>{userScores?.total ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(userScores?.seo ?? 0)}`}>{userScores?.seo ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(userScores?.direct ?? 0)}`}>{userScores?.direct ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(userScores?.schema ?? 0)}`}>{userScores?.schema ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(userScores?.ai ?? 0)}`}>{userScores?.ai ?? 0}</TableCell>
              </TableRow>
            )}
            {competitors.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="truncate max-w-[200px] text-foreground">
                  #{i + 1} {shortenUrl(c.url)}
                </TableCell>
                <TableCell className={`text-center font-bold ${scoreColor(c.scores?.total ?? 0)}`}>{c.scores?.total ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(c.scores?.seo ?? 0)}`}>{c.scores?.seo ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(c.scores?.direct ?? 0)}`}>{c.scores?.direct ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(c.scores?.schema ?? 0)}`}>{c.scores?.schema ?? 0}</TableCell>
                <TableCell className={`text-center ${scoreColor(c.scores?.ai ?? 0)}`}>{c.scores?.ai ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CompetitorsTable;
