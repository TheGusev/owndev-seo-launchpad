import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Download, ChevronRight, ChevronLeft, Copy, FileJson,
  Check, AlertTriangle, ChevronDown, ChevronUp, ExternalLink,
  FileText, Layers, BarChart3, ShieldCheck, Brain, Loader2,
  FileSpreadsheet, Pencil,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ─── Constants ─── */
const NICHES = [
  "Юридические услуги", "Медицина / клиники", "Ремонт квартир",
  "Автосервис", "Доставка еды", "Образование", "Рестораны и кафе",
  "Фитнес и спорт", "Красота и косметология", "IT-услуги",
];

const PAGE_TYPES = [
  { value: "service-city", label: "Услуга + Город" },
  { value: "city-service", label: "Город + Услуга" },
  { value: "category-city", label: "Категория + Город" },
  { value: "district", label: "Район / Округ" },
  { value: "branch", label: "Филиалы / Сеть" },
];

const TONES = [
  { value: "commercial", label: "Коммерческая" },
  { value: "strict", label: "Строгая / Деловая" },
  { value: "expert", label: "Экспертная" },
];

const URL_FORMATS = [
  { value: "service/city", label: "/услуга/город" },
  { value: "city/service", label: "/город/услуга" },
  { value: "service-in-city", label: "/услуга-в-городе" },
];

const CONTENT_BLOCKS = [
  { id: "intro", label: "Вступление" },
  { id: "advantages", label: "Преимущества" },
  { id: "prices", label: "Цены" },
  { id: "faq", label: "FAQ" },
  { id: "reviews", label: "Отзывы" },
  { id: "schema", label: "Schema.org" },
  { id: "cta", label: "CTA-блок" },
];

const AI_MAX_PAGES = 50;
const AI_BATCH_SIZE = 8;
const AI_BATCH_DELAY = 1500;

/* ─── Transliteration ─── */
const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",
  л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",
  ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function slugify(text: string): string {
  return text.toLowerCase().split("").map((ch) => TRANSLIT[ch] ?? ch).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ─── Types ─── */
interface PageRow {
  city: string;
  service: string;
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  h2_1: string;
  h2_2: string;
  intro?: string;
  faq: Array<{ q: string; a: string }>;
  schemaType: string;
  cta: string;
  duplicateRisk: "low" | "medium" | "high";
  aiGenerated?: boolean;
  edited?: boolean;
}

/* ─── Generation logic ─── */
const FAQ_TEMPLATES = [
  (s: string, c: string) => ({ q: `Сколько стоит ${s.toLowerCase()} в ${c}?`, a: `Стоимость ${s.toLowerCase()} в ${c} зависит от объёма работ. Оставьте заявку для расчёта.` }),
  (s: string, c: string) => ({ q: `Как выбрать ${s.toLowerCase()} в ${c}?`, a: `Обратите внимание на опыт, отзывы и портфолио специалистов в ${c}.` }),
  (s: string, c: string) => ({ q: `Какие гарантии на ${s.toLowerCase()} в ${c}?`, a: `Мы предоставляем гарантию на все виды ${s.toLowerCase()} в ${c}.` }),
];

function generateRows(
  niche: string, services: string[], cities: string[],
  pageType: string, urlFormat: string, blocks: string[], tone: string
): PageRow[] {
  const effectiveServices = services.length > 0 ? services : [niche];
  const rows: PageRow[] = [];

  for (const service of effectiveServices) {
    for (const city of cities) {
      const sSlug = slugify(service);
      const cSlug = slugify(city);
      const slug = urlFormat === "city/service" ? `/${cSlug}/${sSlug}`
        : urlFormat === "service-in-city" ? `/${sSlug}-v-${cSlug}`
        : `/${sSlug}/${cSlug}`;

      const title = `${service} в ${city} — цены, отзывы | OWNDEV`;
      const h1 = `${service} в городе ${city}`;
      const meta = `${service} в ${city}. Лучшие специалисты, доступные цены, отзывы клиентов. Звоните!`;
      const h2_1 = `Почему выбирают нас для ${service.toLowerCase()} в ${city}`;
      const h2_2 = `Как заказать ${service.toLowerCase()} в ${city}`;
      const faq = blocks.includes("faq")
        ? FAQ_TEMPLATES.slice(0, 2).map(fn => fn(service, city))
        : [];
      const schemaType = blocks.includes("schema") ? "Service, FAQPage" : "—";
      const cta = `Заказать ${service.toLowerCase()} в ${city}`;

      rows.push({ city, service, slug, title, h1, metaDescription: meta, h2_1, h2_2, faq, schemaType, cta, duplicateRisk: "low" });
    }
  }

  // Calculate duplicate risk
  const titleCounts = new Map<string, number>();
  rows.forEach(r => {
    const base = r.title.replace(/в .+? —/, "в _ —");
    titleCounts.set(base, (titleCounts.get(base) || 0) + 1);
  });
  rows.forEach(r => {
    const base = r.title.replace(/в .+? —/, "в _ —");
    const count = titleCounts.get(base) || 0;
    if (count > 10) r.duplicateRisk = "high";
    else if (count > 5) r.duplicateRisk = "medium";
  });

  return rows;
}

/* ─── AI batch helpers ─── */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ─── Export helpers ─── */
function toCSV(rows: PageRow[]): string {
  const header = "city,service,slug,title,meta_description,h1,h2_1,h2_2,intro,faq_1_q,faq_1_a,faq_2_q,faq_2_a,schema_type,cta,duplicate_risk,ai_generated";
  const lines = rows.map(r => [
    r.city, r.service, r.slug, r.title, r.metaDescription, r.h1, r.h2_1, r.h2_2,
    r.intro || "",
    r.faq[0]?.q || "", r.faq[0]?.a || "", r.faq[1]?.q || "", r.faq[1]?.a || "",
    r.schemaType, r.cta, r.duplicateRisk, r.aiGenerated ? "yes" : "no",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [header, ...lines].join("\n");
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob(["\uFEFF" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Step indicator ─── */
const STEPS = ["Что генерируем", "Структура", "Предпросмотр", "Результат"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 -mx-5 px-5 md:-mx-8 md:px-8">
      {STEPS.slice(0, total).map((label, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
            i + 1 <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>{i + 1}</div>
          <span className={`text-xs sm:text-sm hidden sm:inline whitespace-nowrap ${i + 1 <= current ? "text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < total - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Quality metrics ─── */
function QualityBlock({ rows }: { rows: PageRow[] }) {
  const titleSet = new Set(rows.map(r => r.title));
  const h1Set = new Set(rows.map(r => r.h1));
  const titleUniq = Math.round((titleSet.size / rows.length) * 100);
  const h1Uniq = Math.round((h1Set.size / rows.length) * 100);
  const highRisk = rows.filter(r => r.duplicateRisk === "high").length;
  const medRisk = rows.filter(r => r.duplicateRisk === "medium").length;
  const aiCount = rows.filter(r => r.aiGenerated).length;

  const metrics = [
    { label: "Уникальность Title", value: `${titleUniq}%`, status: titleUniq >= 90 ? "green" : titleUniq >= 70 ? "yellow" : "red" },
    { label: "Уникальность H1", value: `${h1Uniq}%`, status: h1Uniq >= 90 ? "green" : h1Uniq >= 70 ? "yellow" : "red" },
    { label: "Высокий риск дублей", value: `${highRisk} стр.`, status: highRisk === 0 ? "green" : "red" },
    { label: "Средний риск дублей", value: `${medRisk} стр.`, status: medRisk === 0 ? "green" : "yellow" },
    ...(aiCount > 0 ? [{ label: "AI-контент", value: `${aiCount} стр.`, status: "green" as const }] : []),
  ];

  const colors = { green: "text-emerald-400", yellow: "text-yellow-400", red: "text-red-400" };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" /> Проверка качества
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.label}</span>
            <span className={`font-semibold ${colors[m.status as keyof typeof colors]}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Preview card ─── */
function PreviewCard({ row }: { row: PageRow }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Предпросмотр страницы</p>
        {row.aiGenerated && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1">
            <Brain className="w-3 h-3" /> AI
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">URL:</span> <span className="font-mono text-primary">{row.slug}</span></div>
        <div><span className="text-muted-foreground">Title:</span> <span className="text-foreground">{row.title}</span></div>
        <div><span className="text-muted-foreground">H1:</span> <span className="text-foreground font-semibold">{row.h1}</span></div>
        <div><span className="text-muted-foreground">Description:</span> <span className="text-foreground/70">{row.metaDescription}</span></div>
        {row.intro && (
          <div className="pt-1 border-t border-border/30">
            <span className="text-muted-foreground text-xs">Intro:</span>
            <p className="text-xs text-foreground/70 mt-1">{row.intro}</p>
          </div>
        )}
        {row.faq.length > 0 && (
          <div className="pt-1 border-t border-border/30">
            <span className="text-muted-foreground text-xs">FAQ ({row.faq.length}):</span>
            {row.faq.map((f, i) => (
              <div key={i} className="mt-1">
                <p className="text-xs text-foreground/80 font-medium">Q: {f.q}</p>
                <p className="text-xs text-foreground/60">A: {f.a}</p>
              </div>
            ))}
          </div>
        )}
        <div><span className="text-muted-foreground">Schema:</span> <span className="text-foreground/70">{row.schemaType}</span></div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const PSEOGenerator = () => {
  const [step, setStep] = useState(1);
  // Step 1
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [servicesInput, setServicesInput] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [pageType, setPageType] = useState("service-city");
  // Step 2
  const [tone, setTone] = useState("commercial");
  const [blocks, setBlocks] = useState(["intro", "faq", "schema", "cta"]);
  const [urlFormat, setUrlFormat] = useState("service/city");
  const [aiEnabled, setAiEnabled] = useState(false);
  // Step 4
  const [rows, setRows] = useState<PageRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  // AI progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiTotal, setAiTotal] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const effectiveNiche = niche === "__custom" ? customNiche : niche;
  const cities = useMemo(() => citiesInput.split("\n").map(c => c.trim()).filter(Boolean), [citiesInput]);
  const services = useMemo(() => servicesInput.split("\n").map(s => s.trim()).filter(Boolean), [servicesInput]);
  const totalPages = Math.max(1, services.length || 1) * Math.max(cities.length, 0);

  const aiEstimateSeconds = useMemo(() => {
    const pagesToProcess = Math.min(totalPages, AI_MAX_PAGES);
    return Math.ceil(pagesToProcess / AI_BATCH_SIZE) * 3;
  }, [totalPages]);

  const toggleBlock = (id: string) => {
    setBlocks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const canProceed = (s: number) => {
    if (s === 1) return effectiveNiche.trim() !== "" && cities.length > 0;
    if (s === 2) return true;
    if (s === 3) return true;
    return false;
  };

  const generateWithAI = useCallback(async (templateRows: PageRow[]): Promise<PageRow[]> => {
    const pagesToProcess = templateRows.slice(0, AI_MAX_PAGES);
    const batches = chunk(pagesToProcess, AI_BATCH_SIZE);
    const results: PageRow[] = [];

    setAiTotal(pagesToProcess.length);
    setAiProgress(0);
    setAiError(null);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      let retried = false;

      const tryBatch = async (): Promise<void> => {
        try {
          const { data, error } = await supabase.functions.invoke('generate-geo-content', {
            body: {
              pages: batch.map(r => ({ city: r.city, service: r.service, slug: r.slug })),
              niche: effectiveNiche,
              tone,
              blocks,
            },
          });

          if (error) throw error;

          const aiResults = data?.results || [];
          for (const row of batch) {
            const aiData = aiResults.find((r: any) => r.slug === row.slug);
            if (aiData) {
              results.push({
                ...row,
                title: aiData.title || row.title,
                metaDescription: aiData.metaDescription || row.metaDescription,
                h1: aiData.h1 || row.h1,
                h2_1: aiData.h2_1 || row.h2_1,
                h2_2: aiData.h2_2 || row.h2_2,
                intro: aiData.intro || undefined,
                faq: aiData.faq?.length ? aiData.faq : row.faq,
                cta: aiData.cta || row.cta,
                aiGenerated: true,
              });
            } else {
              results.push(row);
            }
          }
        } catch (err: any) {
          const status = err?.status || err?.context?.status;
          if (status === 429 && !retried) {
            retried = true;
            await delay(5000);
            return tryBatch();
          }
          // Fallback to template
          console.warn('AI batch failed, using template:', err);
          results.push(...batch);
        }
      };

      await tryBatch();
      setAiProgress(results.length);

      if (batchIdx < batches.length - 1) {
        await delay(AI_BATCH_DELAY);
      }
    }

    // Add remaining rows beyond AI_MAX_PAGES
    if (templateRows.length > AI_MAX_PAGES) {
      results.push(...templateRows.slice(AI_MAX_PAGES));
    }

    return results;
  }, [effectiveNiche, tone, blocks]);

  const handleGenerate = useCallback(async () => {
    const templateRows = generateRows(effectiveNiche, services, cities, pageType, urlFormat, blocks, tone);

    if (!aiEnabled) {
      setRows(templateRows);
      setStep(4);
      setShowAll(false);
      setPreviewIdx(null);
      return;
    }

    setIsGenerating(true);
    setStep(4);
    setShowAll(false);
    setPreviewIdx(null);

    try {
      const aiRows = await generateWithAI(templateRows);
      // Recalculate duplicate risk for AI rows
      const titleCounts = new Map<string, number>();
      aiRows.forEach(r => {
        const base = r.title.replace(/в .+? —/, "в _ —").replace(/в .+? ·/, "в _ ·");
        titleCounts.set(base, (titleCounts.get(base) || 0) + 1);
      });
      aiRows.forEach(r => {
        const base = r.title.replace(/в .+? —/, "в _ —").replace(/в .+? ·/, "в _ ·");
        const count = titleCounts.get(base) || 0;
        if (count > 10) r.duplicateRisk = "high";
        else if (count > 5) r.duplicateRisk = "medium";
        else r.duplicateRisk = "low";
      });

      setRows(aiRows);
      const aiCount = aiRows.filter(r => r.aiGenerated).length;
      toast({ title: `Готово! ${aiCount} страниц с AI-контентом` });
    } catch {
      setAiError("Ошибка AI-генерации. Используются шаблонные тексты.");
      setRows(templateRows);
    } finally {
      setIsGenerating(false);
    }
  }, [effectiveNiche, services, cities, pageType, urlFormat, blocks, tone, aiEnabled, generateWithAI]);

  const handleExportCSV = () => {
    downloadBlob(toCSV(rows), "geo-pages.csv", "text/csv;charset=utf-8;");
    toast({ title: "CSV скачан" });
  };

  const handleExportJSON = () => {
    downloadBlob(JSON.stringify(rows, null, 2), "geo-pages.json", "application/json;charset=utf-8;");
    toast({ title: "JSON скачан" });
  };

  const handleCopyTable = async () => {
    const text = rows.map(r => `${r.slug}\t${r.title}\t${r.h1}\t${r.metaDescription}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Скопировано в буфер" });
  };

  const displayedRows = showAll ? rows : rows.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Hero pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-2">
        {["До 500 страниц", "AI-контент", "Антидубли", "Экспорт CSV / JSON"].map(pill => (
          <span key={pill} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {pill}
          </span>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 md:p-8">
        <StepIndicator current={step} total={4} />

        {/* ── STEP 1: Что генерируем ── */}
        {step === 1 && (
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ниша / Отрасль</label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Выберите нишу..." /></SelectTrigger>
                  <SelectContent>
                    {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    <SelectItem value="__custom">Своя ниша...</SelectItem>
                  </SelectContent>
                </Select>
                {niche === "__custom" && (
                  <Input placeholder="Введите свою нишу" className="bg-card border-border mt-2" value={customNiche} onChange={e => setCustomNiche(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Тип страниц</label>
                <Select value={pageType} onValueChange={setPageType}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Услуги (по одной на строку, необязательно)</label>
              <Textarea
                placeholder={"Дизайн интерьера\nРемонт ванной\nУстановка кухни"}
                className="bg-card border-border min-h-[90px]"
                value={servicesInput} onChange={e => setServicesInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Города / локации (по одному на строку)</label>
              <Textarea
                placeholder={"Москва\nСанкт-Петербург\nНовосибирск\nЕкатеринбург"}
                className="bg-card border-border min-h-[100px]"
                value={citiesInput} onChange={e => setCitiesInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <GradientButton size="lg" onClick={() => setStep(2)} disabled={!canProceed(1)}>
                Далее <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 2: Структура ── */}
        {step === 2 && (
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Тональность</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Формат URL</label>
                <RadioGroup value={urlFormat} onValueChange={setUrlFormat} className="space-y-2">
                  {URL_FORMATS.map(f => (
                    <div key={f.value} className="flex items-center gap-2">
                      <RadioGroupItem value={f.value} id={`url-${f.value}`} />
                      <label htmlFor={`url-${f.value}`} className="text-sm text-foreground cursor-pointer font-mono">{f.label}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Блоки контента на странице</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CONTENT_BLOCKS.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox checked={blocks.includes(b.id)} onCheckedChange={() => toggleBlock(b.id)} />
                    {b.label}
                  </label>
                ))}
              </div>
            </div>

            {/* AI Toggle */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">AI-контент</p>
                    <p className="text-xs text-muted-foreground">Уникальные тексты вместо шаблонов</p>
                  </div>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              {aiEnabled && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    AI сгенерирует уникальные Title, Description, H1, FAQ и вступление для каждой страницы.
                  </p>
                  {totalPages > AI_MAX_PAGES && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      AI-контент будет создан для первых {AI_MAX_PAGES} страниц. Остальные — шаблонные.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Назад</Button>
              <GradientButton size="lg" onClick={() => setStep(3)}>Далее <ChevronRight className="w-4 h-4 ml-1" /></GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 3: Предпросмотр ── */}
        {step === 3 && (
          <div className="space-y-5 mt-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Что будет создано
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="text-center p-3 rounded-lg bg-card/50">
                  <div className="text-2xl font-bold text-primary font-mono">{totalPages}</div>
                  <div className="text-muted-foreground text-xs">GEO-страниц</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card/50">
                  <div className="text-2xl font-bold text-foreground font-mono">{totalPages}</div>
                  <div className="text-muted-foreground text-xs">Title + H1</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card/50">
                  <div className="text-2xl font-bold text-foreground font-mono">{blocks.includes("faq") ? totalPages * 2 : 0}</div>
                  <div className="text-muted-foreground text-xs">FAQ-вопросов</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Для каждой страницы: slug, title, meta description, H1, H2, FAQ, Schema, CTA
              </p>

              {aiEnabled && (
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    AI сгенерирует уникальные тексты. Примерное время: ~{aiEstimateSeconds} сек.
                  </p>
                </div>
              )}
            </div>

            {/* Sample preview */}
            {cities.length > 0 && (
              <PreviewCard row={generateRows(effectiveNiche, services, [cities[0]], pageType, urlFormat, blocks, tone)[0]} />
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Назад</Button>
              <GradientButton size="lg" onClick={handleGenerate} disabled={isGenerating}>
                {aiEnabled ? (
                  <><Brain className="w-5 h-5 mr-2" /> Создать с AI-контентом</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" /> Создать GEO-страницы</>
                )}
              </GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 4: Результат ── */}
        {step === 4 && (
          <div className="space-y-5 mt-4">
            {/* AI generation progress */}
            {isGenerating && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Генерация AI-контента...</p>
                    <p className="text-xs text-muted-foreground">
                      {aiProgress} из {aiTotal} страниц
                    </p>
                  </div>
                </div>
                <Progress value={aiTotal > 0 ? (aiProgress / aiTotal) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Каждая страница получает уникальные тексты. Это может занять некоторое время.
                </p>
              </div>
            )}

            {aiError && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center gap-2 text-sm text-yellow-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {aiError}
              </div>
            )}

            {!isGenerating && rows.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Сгенерировано {rows.length} страниц
                    </p>
                    {rows.some(r => r.aiGenerated) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1">
                        <Brain className="w-3 h-3" /> {rows.filter(r => r.aiGenerated).length} AI
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
                      <Download className="w-3 h-3" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs">
                      <FileJson className="w-3 h-3" /> JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyTable} className="text-xs">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "OK" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Results table */}
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Slug</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Title</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden md:table-cell">H1</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden lg:table-cell">Риск</th>
                        <th className="py-2 px-2 w-8 text-muted-foreground font-medium hidden sm:table-cell">AI</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.map((row, i) => (
                        <tr key={row.slug + i} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer" onClick={() => setPreviewIdx(previewIdx === i ? null : i)}>
                          <td className="py-2 px-3 font-mono text-primary text-xs max-w-[150px] truncate">{row.slug}</td>
                          <td className="py-2 px-3 text-foreground max-w-[200px] truncate">{row.title}</td>
                          <td className="py-2 px-3 text-foreground hidden md:table-cell max-w-[180px] truncate">{row.h1}</td>
                          <td className="py-2 px-3 hidden lg:table-cell">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              row.duplicateRisk === "high" ? "bg-red-500/10 text-red-400"
                              : row.duplicateRisk === "medium" ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-emerald-500/10 text-emerald-400"
                            }`}>
                              {row.duplicateRisk === "high" ? "Высокий" : row.duplicateRisk === "medium" ? "Средний" : "Низкий"}
                            </span>
                          </td>
                          <td className="py-2 px-2 hidden sm:table-cell">
                            {row.aiGenerated && <Brain className="w-3 h-3 text-primary" />}
                          </td>
                          <td className="py-2 px-2">
                            {previewIdx === i ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rows.length > 10 && !showAll && (
                  <button onClick={() => setShowAll(true)} className="text-xs text-primary hover:underline">
                    Показать все +{rows.length - 10}
                  </button>
                )}

                {previewIdx !== null && displayedRows[previewIdx] && (
                  <PreviewCard row={displayedRows[previewIdx]} />
                )}

                {/* Quality */}
                <QualityBlock rows={rows} />

                {/* Cross-tool CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link to="/tools/anti-duplicate" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/30 hover:border-primary/30 transition-colors text-sm text-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Проверить дубли в Anti-Duplicate Checker</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                  </Link>
                  <Link to="/tools/semantic-core" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/30 hover:border-primary/30 transition-colors text-sm text-foreground">
                    <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Собрать семантику для этих страниц</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                  </Link>
                </div>

                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => { setStep(1); setRows([]); setAiError(null); }}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Новая генерация
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info accordions */}
      {step <= 3 && <InfoAccordions />}
    </div>
  );
};

/* ─── Info accordions ─── */
function InfoAccordions() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(prev => prev === id ? null : id);

  const sections = [
    {
      id: "why", title: "Зачем нужен инструмент",
      content: "Для сетевых компаний, агентств и франшиз, которым нужны посадочные страницы под десятки городов и услуг. Вместо ручного создания 100+ страниц — автоматическая генерация структуры с уникальными Title, H1, FAQ и Schema для каждой комбинации.",
    },
    {
      id: "when", title: "Когда особенно полезен",
      content: "Если у вас 10+ городов присутствия, 5+ услуг или направлений, вы масштабируете локальный спрос через шаблонные страницы. Идеально для CMS на базе таблиц (Tilda, WordPress, Webflow).",
    },
    {
      id: "what", title: "Что создаёт",
      content: "Slug, Title, Meta Description, H1, H2, FAQ-вопросы с ответами, тип Schema.org разметки, CTA-блок — для каждой страницы. Всё экспортируется в CSV или JSON для загрузки в CMS.",
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map(s => (
        <div key={s.id} className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
          <button onClick={() => toggle(s.id)} className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />{s.title}</span>
            {open === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {open === s.id && (
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{s.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PSEOGenerator;
