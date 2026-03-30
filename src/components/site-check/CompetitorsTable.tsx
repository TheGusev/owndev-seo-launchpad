import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

interface Competitor {
  url: string;
  title?: string;
  h1?: string;
  content_length_words?: number;
  has_faq?: boolean;
  has_price_block?: boolean;
  has_reviews?: boolean;
  has_schema?: boolean;
  has_cta_button?: boolean;
  load_speed_sec?: number;
  h2_count?: number;
  images_count?: number;
  top_phrases?: string[];
}

interface CompetitorsTableProps {
  competitors: Competitor[];
  userUrl?: string;
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

function BoolCell({ value }: { value?: boolean }) {
  return value
    ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
    : <X className="w-4 h-4 text-red-500 mx-auto" />;
}

const CompetitorsTable = ({ competitors, userUrl }: CompetitorsTableProps) => {
  if (!competitors || competitors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        Анализ конкурентов ({competitors.length})
      </h2>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {competitors.map((c, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-2 bg-card/50 backdrop-blur">
            <p className="text-sm font-medium text-foreground truncate">
              #{i + 1} {shortenUrl(c.url)}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>Слов: <span className="font-medium">{c.content_length_words ?? "—"}</span></div>
              <div>Скорость: <span className="font-medium">{c.load_speed_sec != null ? `${c.load_speed_sec}с` : "—"}</span></div>
              <div className="flex items-center gap-1">FAQ: <BoolCell value={c.has_faq} /></div>
              <div className="flex items-center gap-1">Цены: <BoolCell value={c.has_price_block} /></div>
              <div className="flex items-center gap-1">Отзывы: <BoolCell value={c.has_reviews} /></div>
              <div className="flex items-center gap-1">Schema: <BoolCell value={c.has_schema} /></div>
              <div className="flex items-center gap-1">CTA: <BoolCell value={c.has_cta_button} /></div>
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
              <TableHead className="text-center w-20">Слов</TableHead>
              <TableHead className="text-center w-14">FAQ</TableHead>
              <TableHead className="text-center w-14">Цены</TableHead>
              <TableHead className="text-center w-16">Отзывы</TableHead>
              <TableHead className="text-center w-16">Schema</TableHead>
              <TableHead className="text-center w-14">CTA</TableHead>
              <TableHead className="text-center w-20">Скорость</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="truncate max-w-[200px] text-foreground">
                  #{i + 1} {shortenUrl(c.url)}
                </TableCell>
                <TableCell className="text-center">{c.content_length_words ?? "—"}</TableCell>
                <TableCell className="text-center"><BoolCell value={c.has_faq} /></TableCell>
                <TableCell className="text-center"><BoolCell value={c.has_price_block} /></TableCell>
                <TableCell className="text-center"><BoolCell value={c.has_reviews} /></TableCell>
                <TableCell className="text-center"><BoolCell value={c.has_schema} /></TableCell>
                <TableCell className="text-center"><BoolCell value={c.has_cta_button} /></TableCell>
                <TableCell className="text-center">
                  {c.load_speed_sec != null ? `${c.load_speed_sec}с` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CompetitorsTable;
