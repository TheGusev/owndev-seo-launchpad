import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles, Download, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const niches = ["Юридические услуги", "Медицина / клиники", "Ремонт квартир", "Автосервис", "Доставка еды", "Образование"];
const pageTypes = [
  { value: "service", label: "Услуга + Город" },
  { value: "category", label: "Категория + Город" },
  { value: "subcategory", label: "Подкатегория + Город" },
];

// Simple transliteration for Russian → Latin slugs
const translitMap: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",
  л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",
  ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => translitMap[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface PageRow {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  templateText: string;
}

function generateRows(niche: string, cities: string[], pageType: string): PageRow[] {
  const nicheSlug = slugify(niche);
  return cities.map((city) => {
    const citySlug = slugify(city);
    const slug = `/${nicheSlug}/${citySlug}`;
    const title = `${niche} в ${city} — цены, отзывы | OWNDEV`;
    const h1 = `${niche} в городе ${city}`;
    const metaDescription = `${niche} в ${city}. ✅ Лучшие специалисты, доступные цены, отзывы клиентов. Звоните!`;
    const templateText = `Ищете ${niche.toLowerCase()} в городе ${city}? Наши специалисты помогут вам с любой задачей. Работаем по всему городу ${city}.`;
    return { slug, title, h1, metaDescription, templateText };
  });
}

function toCSV(rows: PageRow[]): string {
  const header = "slug,title,h1,metaDescription,templateText";
  const lines = rows.map(
    (r) => [r.slug, r.title, r.h1, r.metaDescription, r.templateText].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")
  );
  return [header, ...lines].join("\n");
}

const PSEOGenerator = () => {
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [pageType, setPageType] = useState("");
  const [rows, setRows] = useState<PageRow[]>([]);

  const effectiveNiche = niche === "__custom" ? customNiche : niche;

  const handleGenerate = () => {
    if (!effectiveNiche.trim()) {
      toast({ title: "Выберите или введите нишу", variant: "destructive" });
      return;
    }
    const cities = citiesInput
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cities.length === 0) {
      toast({ title: "Введите хотя бы один город", variant: "destructive" });
      return;
    }
    setRows(generateRows(effectiveNiche, cities, pageType));
  };

  const handleDownloadCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pseo-structure.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{s}</div>
            <span className={`text-sm hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === 1 ? "Ниша" : s === 2 ? "Города" : "Результат"}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Выберите нишу</label>
            <Select onValueChange={(v) => { setNiche(v); setStep(Math.max(step, 2)); }}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите нишу…" />
              </SelectTrigger>
              <SelectContent>
                {niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                <SelectItem value="__custom">Своя ниша…</SelectItem>
              </SelectContent>
            </Select>
            {niche === "__custom" && (
              <Input
                placeholder="Введите свою нишу"
                className="bg-card border-border mt-2"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Тип страницы</label>
            <Select onValueChange={setPageType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите тип…" />
              </SelectTrigger>
              <SelectContent>
                {pageTypes.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Города (по одному на строку)</label>
          <Textarea
            placeholder={"Москва\nСанкт-Петербург\nНовосибирск\nЕкатеринбург"}
            className="bg-card border-border min-h-[120px]"
            value={citiesInput}
            onChange={(e) => { setCitiesInput(e.target.value); setStep(Math.max(step, 3)); }}
          />
        </div>

        <div className="text-center pt-2">
          <GradientButton size="lg" onClick={handleGenerate}>
            <Sparkles className="w-5 h-5 mr-2" />
            Сгенерировать структуру
          </GradientButton>
        </div>

        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Сгенерировано {rows.length} страниц
              </p>
              <button
                onClick={handleDownloadCSV}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Скачать CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Slug</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Title</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">H1</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Meta Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.slug} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-mono text-primary">{row.slug}</td>
                      <td className="py-2 px-3 text-foreground max-w-[200px] truncate">{row.title}</td>
                      <td className="py-2 px-3 text-foreground">{row.h1}</td>
                      <td className="py-2 px-3 text-muted-foreground max-w-[250px] truncate hidden lg:table-cell">{row.metaDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PSEOGenerator;
