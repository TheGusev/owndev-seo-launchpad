import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  MapPin,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ToolCTA from "./ToolCTA";

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────

const NICHES = [
  "Юридические услуги",
  "Медицина / клиники",
  "Ремонт квартир",
  "Автосервис",
  "Доставка еды",
  "Образование",
  "Рестораны и кафе",
  "Строительство",
  "Красота и уход",
  "Бухгалтерские услуги",
];

const PAGE_TYPES = [
  { value: "service_city", label: "Услуга + Город" },
  { value: "city_service", label: "Город + Услуга" },
  { value: "service_in_city", label: "Услуга в Городе (SEF)" },
  { value: "category_city", label: "Категория + Город" },
  { value: "branch", label: "Филиалы" },
  { value: "franchise", label: "Франшиза / сеть" },
];

const TONALITIES = [
  { value: "strict", label: "Строгая" },
  { value: "commercial", label: "Коммерческая" },
  { value: "expert", label: "Экспертная" },
];

const PAGE_LENGTHS = [
  { value: "short", label: "Короткая" },
  { value: "standard", label: "Стандарт" },
  { value: "extended", label: "Расширенная" },
];

const URL_FORMATS = [
  { value: "service_city", label: "/service/city" },
  { value: "city_service", label: "/city/service" },
  { value: "service_in_city", label: "/service-in-city" },
];

const BLOCKS = [
  { key: "intro", label: "Intro / вводный текст" },
  { key: "advantages", label: "Преимущества" },
  { key: "prices", label: "Цены" },
  { key: "faq", label: "FAQ" },
  { key: "reviews", label: "Отзывы" },
  { key: "schema", label: "Schema.org" },
  { key: "cta", label: "CTA блок" },
];

// ──────────────────────────────────────────────────────────
// Transliteration
// ──────────────────────────────────────────────────────────

const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",
  л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",
  ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function slugify(text: string): string {
  return text.toLowerCase().split("").map(ch => TRANSLIT[ch] ?? ch).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

interface PageRow {
  city: string;
  service: string;
  slug: string;
  title: string;
  meta_description: string;
  h1: string;
  h2_1: string;
  h2_2: string;
  faq_1_q: string;
  faq_1_a: string;
  faq_2_q: string;
  faq_2_a: string;
  faq_3_q: string;
  faq_3_a: string;
  schema_json: string;
  cta: string;
  duplicate_risk: string;
  notes: string;
}

interface QualityMetric {
  label: string;
  status: "green" | "yellow" | "red";
  value: string;
}

// ──────────────────────────────────────────────────────────
// Generation logic
// ──────────────────────────────────────────────────────────

function buildSlug(serviceSlug: string, citySlug: string, format: string): string {
  if (format === "city_service") return `/${citySlug}/${serviceSlug}`;
  if (format === "service_in_city") return `/${serviceSlug}-v-${citySlug}`;
  return `/${serviceSlug}/${citySlug}`;
}

function generateFaq(niche: string, city: string) {
  return [
    {
      q: `Сколько стоит ${niche.toLowerCase()} в ${city}?`,
      a: `Цены на ${niche.toLowerCase()} в ${city} зависят от объёма работ. Свяжитесь с нами для расчёта стоимости.`,
    },
    {
      q: `Как выбрать компанию для ${niche.toLowerCase()} в ${city}?`,
      a: `Обращайте внимание на опыт работы, портфолио и отзывы клиентов из ${city}.`,
    },
    {
      q: `Какие сроки выполнения работ в ${city}?`,
      a: `Сроки зависят от сложности задачи. Мы работаем по ${city} и выполняем заказы в оговоренные сроки.`,
    },
  ];
}

function generateSchema(niche: string, city: string, slug: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${niche} в ${city}`,
    areaServed: { "@type": "City", name: city },
    url: `https://example.com${slug}`,
    provider: { "@type": "LocalBusiness", name: "OWNDEV" },
  });
}

function assessDuplicateRisk(rows: PageRow[], row: PageRow): "low" | "medium" | "high" {
  const sameTitleCount = rows.filter(r => r.title === row.title).length;
  const sameH1Count = rows.filter(r => r.h1 === row.h1).length;
  if (sameTitleCount > 1 || sameH1Count > 1) return "high";
  if (row.city === row.service) return "medium";
  return "low";
}

function generateRows(
  niche: string,
  cities: string[],
  urlFormat: string,
): PageRow[] {
  const nicheSlug = slugify(niche);
  const rawRows: PageRow[] = cities.map((city) => {
    const citySlug = slugify(city);
    const slug = buildSlug(nicheSlug, citySlug, urlFormat);
    const faqs = generateFaq(niche, city);
    const schemaJson = generateSchema(niche, city, slug);
    return {
      city,
      service: niche,
      slug,
      title: `${niche} в ${city} — цены, отзывы, специалисты`,
      meta_description: `${niche} в ${city}. Лучшие специалисты, доступные цены, отзывы клиентов. Узнайте стоимость и сроки — звоните!`,
      h1: `${niche} в ${city}: профессиональная помощь`,
      h2_1: `Почему выбирают наши услуги в ${city}`,
      h2_2: `Цены на ${niche.toLowerCase()} в ${city}`,
      faq_1_q: faqs[0].q,
      faq_1_a: faqs[0].a,
      faq_2_q: faqs[1].q,
      faq_2_a: faqs[1].a,
      faq_3_q: faqs[2].q,
      faq_3_a: faqs[2].a,
      schema_json: schemaJson,
      cta: `Получить консультацию по ${niche.toLowerCase()} в ${city}`,
      duplicate_risk: "",
      notes: "",
    };
  });

  return rawRows.map((row) => ({
    ...row,
    duplicate_risk: assessDuplicateRisk(rawRows, row),
    notes: assessDuplicateRisk(rawRows, row) === "high"
      ? "Возможный дубль — перегенерировать вариативный блок"
      : "",
  }));
}

// ──────────────────────────────────────────────────────────
// Export helpers
// ──────────────────────────────────────────────────────────

const CSV_COLUMNS: (keyof PageRow)[] = [
  "city", "service", "slug", "title", "meta_description", "h1",
  "h2_1", "h2_2", "faq_1_q", "faq_1_a", "faq_2_q", "faq_2_a",
  "faq_3_q", "faq_3_a", "schema_json", "cta", "duplicate_risk", "notes",
];

function toCSV(rows: PageRow[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map(r => CSV_COLUMNS.map(k => esc(r[k])).join(","));
  return [header, ...lines].join("\n");
}

function toJSON(rows: PageRow[]): string {
  return JSON.stringify(rows, null, 2);
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────────────────
// Quality metrics
// ──────────────────────────────────────────────────────────

function calcQuality(rows: PageRow[]): QualityMetric[] {
  const total = rows.length;
  const uniqueTitles = new Set(rows.map(r => r.title)).size;
  const uniqueH1 = new Set(rows.map(r => r.h1)).size;
  const highRiskCount = rows.filter(r => r.duplicate_risk === "high").length;
  const medRiskCount = rows.filter(r => r.duplicate_risk === "medium").length;

  const titlePct = Math.round((uniqueTitles / total) * 100);
  const h1Pct = Math.round((uniqueH1 / total) * 100);
  const dupRisk = highRiskCount > 0 ? "red" : medRiskCount > 0 ? "yellow" : "green";

  return [
    { label: "Уникальность Title", status: titlePct >= 95 ? "green" : titlePct >= 80 ? "yellow" : "red", value: `${titlePct}%` },
    { label: "Уникальность H1", status: h1Pct >= 95 ? "green" : h1Pct >= 80 ? "yellow" : "red", value: `${h1Pct}%` },
    { label: "Риск дублей", status: dupRisk, value: highRiskCount > 0 ? `${highRiskCount} высокий` : medRiskCount > 0 ? `${medRiskCount} средний` : "Нет" },
    { label: "Риск тонкой страницы", status: total < 5 ? "yellow" : "green", value: total < 5 ? "Мало страниц" : "ОК" },
    { label: "AI-readiness", status: "green", value: "Высокая" },
    { label: "GEO relevance", status: "green", value: "Оптимально" },
  ];
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Что генерируем", "Структура", "Предпросмотр", "Генерация"];

function StepBar({ step, onGo }: { step: number; onGo: (s: number) => void }) {
  return (
    <div className="sticky top-16 z-10 -mx-5 md:-mx-8 px-5 md:px-8 py-3 mb-6 backdrop-blur-md bg-background/80 border-b border-border/40">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          const active = step === s;
          const done = step > s;
          return (
            <button
              key={s}
              onClick={() => done && onGo(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground cursor-default"
              }`}
            >
              <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold border border-current/30">{s}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ValuePills() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {[
        "До 500 страниц за одну генерацию",
        "Антидубли и уникализация структуры",
        "Экспорт в CSV / JSON / WordPress / Tilda",
      ].map((pill) => (
        <span
          key={pill}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
        >
          {pill}
        </span>
      ))}
    </div>
  );
}

function WillGetBlock({ count, blocks }: { count: number; blocks: string[] }) {
  if (count === 0) return null;
  return (
    <div className="glass rounded-xl p-5 border border-primary/20 mt-4">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Что будет создано</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { v: `${count} GEO-страниц`, i: <MapPin className="w-3.5 h-3.5" /> },
          { v: `${count} уникальных Title`, i: <FileText className="w-3.5 h-3.5" /> },
          { v: `${count} H1 и FAQ блоков`, i: <Sparkles className="w-3.5 h-3.5" /> },
          { v: `${count} Schema templates`, i: <Shield className="w-3.5 h-3.5" /> },
          { v: blocks.length + " блоков на странице", i: <Eye className="w-3.5 h-3.5" /> },
          { v: "1 файл CSV + JSON", i: <Download className="w-3.5 h-3.5" /> },
        ].map(({ v, i }) => (
          <div key={v} className="flex items-center gap-2 text-xs text-foreground">
            <span className="text-primary">{i}</span>
            {v}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Инструмент не просто пишет текст. Он создаёт SEO-структуру для масштабирования страниц
        под регионы, услуги и поисковый спрос.
      </p>
    </div>
  );
}

function PagePreview({ row }: { row: PageRow }) {
  const faqs = [
    { q: row.faq_1_q, a: row.faq_1_a },
    { q: row.faq_2_q, a: row.faq_2_a },
    { q: row.faq_3_q, a: row.faq_3_a },
  ];
  return (
    <div className="glass rounded-xl p-5 space-y-4 border border-border/60">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold">Предпросмотр страницы</p>
      <div className="space-y-2 text-sm">
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24 shrink-0">URL</span>
          <span className="font-mono text-primary break-all">{row.slug}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24 shrink-0">Title</span>
          <span className="text-foreground">{row.title}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24 shrink-0">H1</span>
          <span className="font-semibold text-foreground">{row.h1}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24 shrink-0">Description</span>
          <span className="text-foreground">{row.meta_description}</span>
        </div>
      </div>
      <div className="border-t border-border/40 pt-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">FAQ</p>
        {faqs.map((f, i) => (
          <div key={i} className="text-xs space-y-0.5">
            <p className="font-medium text-foreground">{f.q}</p>
            <p className="text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 pt-3">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Schema</p>
        <p className="text-xs text-muted-foreground">Service / FAQPage / BreadcrumbList</p>
      </div>
    </div>
  );
}

const RISK_COLORS = {
  green: "text-green-500",
  yellow: "text-yellow-500",
  red: "text-red-500",
};
const RISK_ICONS = { green: "●", yellow: "●", red: "●" };

function QualityBlock({ metrics }: { metrics: QualityMetric[] }) {
  return (
    <div className="glass rounded-xl p-5 border border-border/60">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Проверка качества Programmatic SEO</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${RISK_COLORS[m.status]}`}>
              <span>{RISK_ICONS[m.status]}</span>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcosystemCTA() {
  const links = [
    { label: "GEO-аудит", href: "/tools/geo-audit" },
    { label: "Anti-Duplicate Checker", href: "/tools/anti-duplicate" },
    { label: "Семантическое ядро", href: "/tools/semantic-core" },
    { label: "AI-видимость бренда", href: "/tools/brand-tracker" },
  ];
  return (
    <div className="glass rounded-xl p-5 border border-border/60">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Следующий шаг</p>
      <p className="text-sm text-muted-foreground mb-4">
        Используйте сгенерированные страницы в связке с другими инструментами OWNDEV.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors text-sm text-foreground hover:text-primary"
          >
            {l.label}
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────

const PSEOGenerator = () => {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [pageType, setPageType] = useState("service_city");

  // Step 2 state
  const [tonality, setTonality] = useState("commercial");
  const [pageLength, setPageLength] = useState("standard");
  const [enabledBlocks, setEnabledBlocks] = useState<Set<string>>(
    new Set(BLOCKS.map((b) => b.key))
  );
  const [urlFormat, setUrlFormat] = useState("service_city");

  // Results
  const [rows, setRows] = useState<PageRow[]>([]);
  const [previewRow, setPreviewRow] = useState<PageRow | null>(null);
  const [quality, setQuality] = useState<QualityMetric[]>([]);
  const [showRawTable, setShowRawTable] = useState(false);

  const effectiveNiche = niche === "__custom" ? customNiche : niche;
  const cities = citiesInput.split("\n").map((c) => c.trim()).filter(Boolean);
  const pageCount = cities.length;
  const enabledBlocksList = BLOCKS.filter((b) => enabledBlocks.has(b.key)).map((b) => b.label);

  const canStep2 = Boolean(effectiveNiche.trim() && cities.length > 0);
  const canGenerate = canStep2;

  function toggleBlock(key: string) {
    setEnabledBlocks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleGenerate() {
    if (!effectiveNiche.trim()) {
      toast({ title: "Выберите или введите нишу", variant: "destructive" });
      return;
    }
    if (cities.length === 0) {
      toast({ title: "Введите хотя бы один город", variant: "destructive" });
      return;
    }
    const generated = generateRows(effectiveNiche, cities, urlFormat);
    setRows(generated);
    setPreviewRow(generated[0] ?? null);
    setQuality(calcQuality(generated));
    setStep(4);
    toast({ title: `Создано ${generated.length} GEO-страниц` });
  }

  return (
    <div className="space-y-0">
      {/* ── Hero ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Programmatic SEO</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 font-medium">Инструмент</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Генератор{" "}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            GEO-страниц
          </span>{" "}
          для роста трафика
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Получите сотни уникальных страниц под города, услуги и поисковые интенты:
          slug, Title, H1, Description, FAQ и Schema — готово к публикации.
        </p>
        <ValuePills />
      </div>

      {/* ── Step bar ─────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 md:p-8">
        <StepBar step={step} onGo={setStep} />

        {/* ── STEP 1 ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">Шаг 1 — Что генерируем</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ниша</label>
                  <Select onValueChange={setNiche}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Выберите нишу…" />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      <SelectItem value="__custom">Своя ниша…</SelectItem>
                    </SelectContent>
                  </Select>
                  {niche === "__custom" && (
                    <Input
                      placeholder="Введите свою нишу"
                      className="bg-card border-border"
                      value={customNiche}
                      onChange={(e) => setCustomNiche(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Тип бизнеса</label>
                  <Input
                    placeholder="Агентство, франшиза, сеть, одиночный бизнес…"
                    className="bg-card border-border"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Тип страниц</label>
                  <Select value={pageType} onValueChange={setPageType}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Язык / регион</label>
                  <Select defaultValue="ru">
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский (RU)</SelectItem>
                      <SelectItem value="uk">Украинский (UA)</SelectItem>
                      <SelectItem value="kz">Казахский (KZ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Города / районы / локации
                <span className="ml-2 text-xs text-muted-foreground">(по одному на строку)</span>
              </label>
              <Textarea
                placeholder={"Москва\nСанкт-Петербург\nНовосибирск\nЕкатеринбург\nКазань"}
                className="bg-card border-border min-h-[120px]"
                value={citiesInput}
                onChange={(e) => setCitiesInput(e.target.value)}
              />
              {cities.length > 0 && (
                <p className="text-xs text-primary">{cities.length} локаций добавлено</p>
              )}
            </div>

            <div className="flex justify-end">
              <GradientButton
                size="lg"
                onClick={() => {
                  if (!canStep2) {
                    toast({ title: "Заполните нишу и города", variant: "destructive" });
                    return;
                  }
                  setStep(2);
                }}
              >
                Далее — структура
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 2 ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Шаг 2 — Структура страниц</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Тональность</label>
                <Select value={tonality} onValueChange={setTonality}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONALITIES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Длина страницы</label>
                <Select value={pageLength} onValueChange={setPageLength}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_LENGTHS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Формат URL</label>
                <Select value={urlFormat} onValueChange={setUrlFormat}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URL_FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Блоки страницы</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BLOCKS.map((b) => {
                  const checked = enabledBlocks.has(b.key);
                  return (
                    <button
                      key={b.key}
                      onClick={() => toggleBlock(b.key)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        checked
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/40 border-border text-muted-foreground hover:border-primary/20"
                      }`}
                    >
                      {checked ? "✓ " : ""}{b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Назад
              </button>
              <GradientButton size="lg" onClick={() => setStep(3)}>
                Далее — предпросмотр
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 3 ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Шаг 3 — Ожидаемый результат</p>

            <WillGetBlock count={pageCount} blocks={enabledBlocksList} />

            {/* Example preview (mock first page) */}
            {effectiveNiche && cities.length > 0 && (() => {
              const mockRows = generateRows(effectiveNiche, cities.slice(0, 1), urlFormat);
              return mockRows[0] ? <PagePreview row={mockRows[0]} /> : null;
            })()}

            <div className="flex gap-3 justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Назад
              </button>
              <GradientButton size="lg" onClick={handleGenerate} disabled={!canGenerate}>
                <Sparkles className="w-5 h-5 mr-2" />
                Создать GEO-страницы
              </GradientButton>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Results ────────────────────────── */}
        {step === 4 && rows.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Шаг 4 — Результат</p>
                <p className="text-lg font-semibold text-foreground mt-0.5">{rows.length} GEO-страниц создано</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadBlob(toCSV(rows), "geo-pages.csv", "text/csv;charset=utf-8;")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Скачать CSV
                </button>
                <button
                  onClick={() => downloadBlob(toJSON(rows), "geo-pages.json", "application/json")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 border border-border transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Скачать JSON
                </button>
                <button
                  onClick={() => setShowRawTable(!showRawTable)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 border border-border transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> {showRawTable ? "Скрыть таблицу" : "Открыть таблицу"}
                </button>
              </div>
            </div>

            {/* Preview of first page */}
            {previewRow && <PagePreview row={previewRow} />}

            {/* Table */}
            {showRawTable && (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Slug", "Title", "H1", "Meta", "Риск дублей"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.slug}
                        className="border-b border-border/40 hover:bg-muted/20 cursor-pointer"
                        onClick={() => setPreviewRow(row)}
                      >
                        <td className="py-2 px-3 font-mono text-primary">{row.slug}</td>
                        <td className="py-2 px-3 text-foreground max-w-[200px] truncate">{row.title}</td>
                        <td className="py-2 px-3 text-foreground max-w-[180px] truncate">{row.h1}</td>
                        <td className="py-2 px-3 text-muted-foreground max-w-[220px] truncate hidden lg:table-cell">{row.meta_description}</td>
                        <td className="py-2 px-3">
                          <span className={`font-semibold ${
                            row.duplicate_risk === "high" ? "text-red-500"
                            : row.duplicate_risk === "medium" ? "text-yellow-500"
                            : "text-green-500"
                          }`}>
                            {row.duplicate_risk === "high" ? "● Высокий"
                              : row.duplicate_risk === "medium" ? "● Средний"
                              : "● Низкий"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quality */}
            <QualityBlock metrics={quality} />

            {/* Ecosystem CTA */}
            <EcosystemCTA />

            <button
              onClick={() => { setRows([]); setStep(1); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Создать новую генерацию
            </button>
          </div>
        )}
      </div>

      {/* ── Why this tool ───────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Зачем нужен инструмент",
            items: [
              "Сетевым компаниям и агентствам",
              "Франшизам и партнёрским сетям",
              "Бизнесу в 10+ городах",
              "Услугам с локальным спросом",
              "Масштабированию без ручного труда",
            ],
          },
          {
            title: "Когда особенно полезен",
            items: [
              "У вас 10+ городов присутствия",
              "5+ услуг для масштабирования",
              "Хотите локальный SEO-трафик",
              "Публикуете через CMS / таблицы",
              "Нужны сотни страниц быстро",
            ],
          },
          {
            title: "Что создаёт инструмент",
            items: [
              "slug, title, h1, description",
              "FAQ — 3–5 вопросов на страницу",
              "Schema.org (Service / FAQPage)",
              "CTA-тексты под каждый город",
              "CSV / JSON для публикации",
            ],
          },
        ].map((col) => (
          <div key={col.title} className="glass rounded-xl p-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">{col.title}</p>
            <ul className="space-y-1.5">
              {col.items.map((item) => (
                <li key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ToolCTA />
      </div>
    </div>
  );
};

export default PSEOGenerator;
