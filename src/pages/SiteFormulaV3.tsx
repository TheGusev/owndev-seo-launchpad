/**
 * Site Formula V3 — единая страница: визуальные этапы 0-7
 *   0. Выбор типа проекта (Tier A/B/C — 23 вертикали)
 *   1. Ввод бренда + URL + seeds
 *   2. INTAKE
 *   3. DEMAND (Wordstat)
 *   4. CRAWL
 *   5. AUDIT (PageEvidence)
 *   6. PREFLIGHT (4 оси: SEO≥85 / Direct≥90 / Schema=100 / AI/LLM≥85)
 *   7. PACK (super_prompt_pack v1 → ZIP)
 *
 * Доступна по `/site-formula/v3`. Старые `/site-formula/v2` и `/site-formula`
 * редиректят сюда (см. App.tsx).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Search,
  ListChecks,
  Shield,
  Package,
  Crown,
  ArrowRight,
  ArrowLeft,
  FileJson,
  FileText,
  Layers3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formulaV3Api,
  type ProjectTypeV3,
  type ProjectTypeCodeV3,
  type PipelineResultV3,
  type ExportMode,
  type PlatformTarget,
} from '@/lib/api/formulaV3';

type Stage =
  | 'pick_type'
  | 'fill_intake'
  | 'running'
  | 'done'
  | 'failed';

/**
 * Нормализация URL: клиент может ввести `example.ru`,
 * `www.example.ru`, `санитарные-решения.рф` и т.п. — все эти
 * варианты должны вылетать на бэкенд как `https://...`,
 * иначе zod URL-валидатор падает с 'Invalid url'.
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type StageKey = 'intake' | 'demand' | 'crawl' | 'audit' | 'preflight' | 'pack';

const STAGE_LABELS: Record<StageKey, { ru: string; icon: any }> = {
  intake: { ru: 'Приём данных', icon: Sparkles },
  demand: { ru: 'Спрос (Wordstat)', icon: Search },
  crawl: { ru: 'Сбор сайта', icon: Globe },
  audit: { ru: 'Аудит страниц', icon: ListChecks },
  preflight: { ru: 'Preflight 4 оси', icon: Shield },
  pack: { ru: 'Developer Pack', icon: Package },
};

const TIER_LABELS: Record<string, string> = {
  A: 'Tier A — Web/SEO',
  B: 'Tier B — App-driven',
  C: 'Tier C — Спец. вертикали',
};

/** Карточки формата пакета вместо голого <select>. */
const PACK_MODES: Array<{
  value: ExportMode;
  title: string;
  desc: string;
  icon: any;
  recommended?: boolean;
}> = [
  {
    value: 'structured',
    title: 'Structured',
    desc: 'JSON спецификация + per-section MD — универсальный вариант',
    icon: Layers3,
    recommended: true,
  },
  {
    value: 'full',
    title: 'Full bundle',
    desc: 'Единый super_prompt_pack.json — всё в одном файле',
    icon: FileJson,
  },
  {
    value: 'platform_specific',
    title: 'Platform-specific',
    desc: 'Специальные файлы под Lovable / Cursor / v0 / Claude Code',
    icon: FileText,
  },
];

export default function SiteFormulaV3() {
  const [stage, setStage] = useState<Stage>('pick_type');
  const [types, setTypes] = useState<ProjectTypeV3[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ProjectTypeCodeV3 | null>(null);

  const [siteUrl, setSiteUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [city, setCity] = useState('');
  const [seedsText, setSeedsText] = useState('');
  const [packMode, setPackMode] = useState<ExportMode>('structured');
  const [platform, setPlatform] = useState<PlatformTarget>('lovable');

  const [result, setResult] = useState<PipelineResultV3 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    formulaV3Api
      .listProjectTypes()
      .then((r) => setTypes(r.types ?? []))
      .catch((e) => {
        console.error(e);
        toast.error('Не удалось загрузить список типов проектов');
      })
      .finally(() => setTypesLoading(false));
  }, []);

  const groupedByTier = useMemo(() => {
    const by: Record<string, ProjectTypeV3[]> = { A: [], B: [], C: [], _: [] };
    for (const t of types) {
      const k = t.tier ?? '_';
      (by[k] ?? by._).push(t);
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => a.sort_order - b.sort_order);
    }
    return by;
  }, [types]);

  function handlePickType(code: ProjectTypeCodeV3) {
    setSelectedType(code);
    setStage('fill_intake');
  }

  async function handleRun() {
    if (!selectedType || !siteUrl || !brandName) {
      toast.error('Заполните URL, название бренда и тип');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    setStage('running');
    try {
      const seeds = seedsText
        .split(/[\n,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await formulaV3Api.runPipeline({
        root_url: normalizeUrl(siteUrl),
        project_code: selectedType,
        brand: {
          name: brandName,
          industry: industry || 'услуги',
          target_audience: targetAudience || 'целевая аудитория проекта',
          primary_city: city || undefined,
        },
        seed_keywords: seeds.length > 0 ? seeds : undefined,
        pack_mode: packMode,
        platform_target: packMode === 'platform_specific' ? platform : undefined,
        ai_training_policy: 'allow_with_attribution',
        max_crawl_pages: 20,
      });
      setResult(r.result);
      setStage(r.result.status === 'done' ? 'done' : 'failed');
      if (r.result.status === 'done') {
        toast.success(`Pipeline завершён: ${r.result.preflight_rollup?.total_pages ?? 0} страниц`);
      } else {
        toast.error('Pipeline завершился с ошибкой');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Ошибка запуска pipeline');
      setStage('failed');
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result?.job_id) return;
    const url = formulaV3Api.getPackZipUrl(result.job_id);
    window.open(url, '_blank');
  }

  // ─── render ────────────────────────────────────────────────
  // Прогресс wizard'а: шаг 1 из 3 / шаг 2 из 3 / прогон.
  const stepNum = stage === 'pick_type' ? 1 : stage === 'fill_intake' ? 2 : 3;
  const stepProgress = (stepNum / 3) * 100;

  return (
    <>
      <Helmet>
        <title>Site Formula PRO — точный blueprint с Wordstat и Preflight | OWNDEV</title>
        <meta
          name="description"
          content="Site Formula PRO — 23 типа проекта, спрос из Wordstat, техпаспорт (llms.txt + 17 AI-ботов), Preflight 4-осей и super_prompt_pack для Lovable / Cursor / v0 / Claude Code."
        />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          {/* Hero в стиле обычной формулы */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
                <Link to="/site-formula">
                  <ArrowLeft className="h-4 w-4" /> К Site Formula
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 gap-1">
                <Crown className="h-3 w-3" /> PRO · Beta
              </Badge>
              <Badge variant="outline" className="border-fuchsia-500/40 text-fuchsia-400">
                Ранний доступ
              </Badge>
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight">
              Site Formula{' '}
              <span className="bg-gradient-to-r from-amber-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
                PRO
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              23 типа проекта, спрос из Wordstat, технический паспорт (llms.txt + 17 AI-ботов),
              Preflight 4-осей и super_prompt_pack для Lovable / Cursor / v0 / Claude Code.
            </p>
            {/* Прогресс wizard'а */}
            {stage !== 'done' && stage !== 'failed' && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Шаг {stepNum} из 3</span>
                  <span>
                    {stepNum === 1 && 'Выбор типа проекта'}
                    {stepNum === 2 && 'Данные бренда и формат пакета'}
                    {stepNum === 3 && 'Генерация pipeline'}
                  </span>
                </div>
                <Progress value={stepProgress} className="h-1.5" />
              </div>
            )}
          </div>

      {stage === 'pick_type' && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 1. Выберите тип проекта</CardTitle>
            <CardDescription>
              Tier A — SEO-driven веб-сайты, Tier B — приложения, Tier C — специальные вертикали
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загружаем 23 типа…
              </div>
            ) : (
              <Tabs defaultValue="A">
                <TabsList>
                  <TabsTrigger value="A">{TIER_LABELS.A} ({groupedByTier.A?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="B">{TIER_LABELS.B} ({groupedByTier.B?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="C">{TIER_LABELS.C} ({groupedByTier.C?.length ?? 0})</TabsTrigger>
                </TabsList>
                {(['A', 'B', 'C'] as const).map((tier) => (
                  <TabsContent key={tier} value={tier}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {(groupedByTier[tier] ?? []).map((t) => (
                        <button
                          key={t.code}
                          onClick={() => handlePickType(t.code)}
                          className="text-left border rounded-lg p-4 hover:border-primary hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{t.name_ru}</span>
                            <Badge variant="outline" className="text-xs">{t.code}</Badge>
                          </div>
                          {t.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {stage === 'fill_intake' && selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Шаг 2. Данные бренда</CardTitle>
            <CardDescription>
              Тип: <Badge variant="secondary">{selectedType}</Badge>{' '}
              <Button variant="link" size="sm" onClick={() => setStage('pick_type')}>сменить</Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="url">URL сайта *</Label>
                <Input
                  id="url"
                  placeholder="example.ru или https://example.ru"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Можно без https:// — добавим автоматически. Кириллица поддерживается.
                </p>
              </div>
              <div>
                <Label htmlFor="brand">Название бренда *</Label>
                <Input id="brand" placeholder="ООО «Пример»" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="industry">Отрасль / основная услуга</Label>
                <Input id="industry" placeholder="Грузоперевозки, ремонт, маркетинг…" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">Город (для гео-вертикалей)</Label>
                <Input id="city" placeholder="Москва" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="audience">Целевая аудитория</Label>
                <Input id="audience" placeholder="Малый бизнес 25-55, ИП, ООО" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="seeds">Seed-ключи (Wordstat) — по строке или через запятую</Label>
                <Textarea
                  id="seeds"
                  rows={3}
                  placeholder={'грузоперевозки москва\nгазель срочно\nпереезд квартиры'}
                  value={seedsText}
                  onChange={(e) => setSeedsText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Если пусто — стадия DEMAND будет пропущена.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t space-y-3">
              <div>
                <Label className="text-base">Формат пакета</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Как выходные файлы будут упакованы. Для большинства случаев подходит Structured.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PACK_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = packMode === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPackMode(m.value)}
                        className={`text-left rounded-lg border p-4 transition-colors hover:border-primary/60 ${
                          active
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          {m.recommended && (
                            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                              Рекомендуем
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold text-sm mb-1">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {packMode === 'platform_specific' && (
                <div>
                  <Label className="text-base">Целевая платформа</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Где вы будете собирать сайт — под эту платформу сформируем инструкции.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(
                      [
                        { v: 'lovable', label: 'Lovable' },
                        { v: 'cursor', label: 'Cursor' },
                        { v: 'v0', label: 'v0' },
                        { v: 'claude_code', label: 'Claude Code' },
                        { v: 'raw', label: 'Raw' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setPlatform(p.v as PlatformTarget)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          platform === p.v
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleRun}
                disabled={busy || !siteUrl || !brandName}
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {!busy && <Crown className="h-4 w-4" />}
                Запустить PRO pipeline
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setStage('pick_type')}>Назад</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(stage === 'running' || stage === 'done' || stage === 'failed') && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {stage === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
                {stage === 'done' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {stage === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {stage === 'running' ? 'Pipeline выполняется…' : stage === 'done' ? 'Готово' : 'Не пройдено'}
              </CardTitle>
              <CardDescription>{siteUrl} · {selectedType}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {(Object.keys(STAGE_LABELS) as StageKey[]).map((key) => {
                  const stageInfo = result?.stages.find((s) => s.stage === key);
                  const Icon = STAGE_LABELS[key].icon;
                  const done = stageInfo?.ok === true;
                  const failed = stageInfo?.ok === false;
                  const inProgress = stage === 'running' && !stageInfo;
                  return (
                    <div
                      key={key}
                      className={`border rounded-lg p-3 text-center ${
                        done ? 'border-green-500 bg-green-50' : failed ? 'border-red-500 bg-red-50' : 'border-muted'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${
                        done ? 'text-green-600' : failed ? 'text-red-600' : 'text-muted-foreground'
                      }`} />
                      <div className="text-xs font-medium">{STAGE_LABELS[key].ru}</div>
                      {stageInfo && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {stageInfo.duration_ms}ms
                        </div>
                      )}
                      {inProgress && (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto mt-1 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {result?.preflight_rollup && (
            <Card>
              <CardHeader>
                <CardTitle>Preflight Rollup</CardTitle>
                <CardDescription>
                  {result.preflight_rollup.total_pages} страниц · {result.preflight_rollup.pages_passed} прошли · {result.preflight_rollup.pages_failed} упали
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AxisRow label="SEO" score={result.preflight_rollup.axis_avg.seo} threshold={85} />
                  <AxisRow label="Direct" score={result.preflight_rollup.axis_avg.direct} threshold={90} />
                  <AxisRow label="Schema" score={result.preflight_rollup.axis_avg.schema} threshold={100} />
                  <AxisRow label="AI / LLM" score={result.preflight_rollup.axis_avg.ai_llm} threshold={85} />
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total avg</span>
                      <span className={`font-bold ${result.preflight_rollup.avg_total_score >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {result.preflight_rollup.avg_total_score} / 100
                      </span>
                    </div>
                  </div>
                  {result.preflight_rollup.failed_p0_codes.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTitle>P0 fail-коды</AlertTitle>
                      <AlertDescription>
                        {result.preflight_rollup.failed_p0_codes.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {stage === 'done' && result?.pack && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Developer Pack готов
                </CardTitle>
                <CardDescription>
                  Версия {result.pack.version} · режим {result.pack.export_mode ?? packMode}
                  {result.pack_zip_size && ` · ZIP ${(result.pack_zip_size / 1024).toFixed(1)} KB`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Скачать ZIP
                  </Button>
                  <Button variant="outline" onClick={() => { setStage('pick_type'); setResult(null); }}>
                    Новый проект
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function AxisRow({ label, score, threshold }: { label: string; score: number; threshold: number }) {
  const passed = score >= threshold;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={passed ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
          {score} / {threshold}
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}
