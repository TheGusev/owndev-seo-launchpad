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
import { Helmet } from 'react-helmet-async';
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
        root_url: siteUrl,
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
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Helmet>
        <title>Site Formula V3 — owndev.ru</title>
        <meta
          name="description"
          content="Site Formula V3 — генератор сайтов с гарантированным прохождением Preflight 4-осей: SEO/Direct/Schema/AI-LLM ≥ 90."
        />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Formula V3</h1>
        <p className="text-muted-foreground">
          23 типа проекта, спрос из Wordstat, технический паспорт (llms.txt + 17 AI-ботов),
          Preflight 4-осей и super_prompt_pack v1 для Lovable / Cursor / v0 / Claude Code.
        </p>
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
                <Input id="url" placeholder="https://example.ru" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label>Формат пакета</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={packMode}
                  onChange={(e) => setPackMode(e.target.value as ExportMode)}
                >
                  <option value="structured">Structured (JSON + per-section MD)</option>
                  <option value="full">Full (single super_prompt_pack.json)</option>
                  <option value="platform_specific">Platform-specific</option>
                </select>
              </div>
              {packMode === 'platform_specific' && (
                <div>
                  <Label>Платформа</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PlatformTarget)}
                  >
                    <option value="lovable">Lovable (PROMPT.md)</option>
                    <option value="cursor">Cursor (.cursor/rules)</option>
                    <option value="v0">v0 (prompt.txt)</option>
                    <option value="claude_code">Claude Code (CLAUDE.md + specs)</option>
                    <option value="raw">Raw (structured)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleRun} disabled={busy || !siteUrl || !brandName}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Запустить V3 pipeline
              </Button>
              <Button variant="outline" onClick={() => setStage('pick_type')}>Назад</Button>
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
