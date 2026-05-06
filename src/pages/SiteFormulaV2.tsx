/**
 * Formula v2 — единая страница: выбор типа из 19 вертикалей → ввод URL и
 * данных бизнеса → запуск crawl+audit → preflight → скачать AI Developer Pack.
 *
 * Полностью отделена от v1 (`/site-formula`). Доступна по `/site-formula/v2`.
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
import {
  formulaV2Api,
  type ProjectType,
  type ProjectTypeCode,
  type BlueprintV2,
  type AuditReport,
} from '@/lib/api/formulaV2';
import { Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Stage = 'pick_type' | 'fill_intake' | 'auditing' | 'building' | 'ready' | 'pack_built';

export default function SiteFormulaV2() {
  const [stage, setStage] = useState<Stage>('pick_type');
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ProjectTypeCode | null>(null);

  const [siteUrl, setSiteUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintV2 | null>(null);
  const [packId, setPackId] = useState<string | null>(null);
  const [packMeta, setPackMeta] = useState<{ size: number; sha: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    formulaV2Api
      .listProjectTypes()
      .then((r) => setTypes(r.types))
      .catch((e) => {
        console.error(e);
        toast.error('Не удалось загрузить список типов проектов');
      })
      .finally(() => setTypesLoading(false));
  }, []);

  const groupedTypes = useMemo(() => {
    const by: Record<string, ProjectType[]> = {};
    for (const t of types) {
      if (!by[t.group_code]) by[t.group_code] = [];
      by[t.group_code].push(t);
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => a.sort_order - b.sort_order);
    }
    return by;
  }, [types]);

  function handlePickType(code: ProjectTypeCode) {
    setSelectedType(code);
    setStage('fill_intake');
  }

  async function handleRunAudit() {
    if (!selectedType || !siteUrl) {
      toast.error('Укажите тип проекта и URL сайта');
      return;
    }
    setError(null);
    setBusy(true);
    setStage('auditing');
    try {
      const r = await formulaV2Api.runAudit({
        url: siteUrl,
        project_type_code: selectedType,
        max_pages: 50,
        respect_robots: true,
      });
      setAudit(r.audit);
      toast.success(`Аудит готов: ${r.audit.pages_audited}/${r.audit.pages_total} страниц`);
      setStage('building');
      // Build blueprint
      const buildResp = await formulaV2Api.build({
        project_type_code: selectedType,
        business_name: businessName || extractBrand(siteUrl),
        site_url: siteUrl,
        short_description: shortDesc || `${businessName || extractBrand(siteUrl)} — официальный сайт`,
        phone,
        city,
        ai_bots_policy: 'allow',
      });
      setBlueprint(buildResp.blueprint);
      setStage('ready');
    } catch (e: any) {
      setError(e?.message || String(e));
      toast.error(`Ошибка: ${e?.message || e}`);
      setStage('fill_intake');
    } finally {
      setBusy(false);
    }
  }

  async function handleBuildPack() {
    if (!blueprint) return;
    setBusy(true);
    setError(null);
    try {
      const r = await formulaV2Api.buildAiPack({
        blueprint,
        audit_id: audit?.audit_id,
        business_name: businessName || extractBrand(siteUrl),
        site_url: siteUrl,
        publish_threshold: 90,
      });
      setPackId(r.pack_id);
      setPackMeta({ size: r.zip_size_bytes, sha: r.zip_sha256 });
      setStage('pack_built');
      toast.success('AI Developer Pack готов к скачиванию');
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      if (msg.includes('preflight_gate') || msg.includes('Preflight gate')) {
        toast.error('Preflight Gate: score < 90, экспорт заблокирован. Сначала примените Recovery.');
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet>
        <title>Site Formula v2 — SEO/GEO/CRO формула | OWNDEV</title>
        <meta name="description" content="Запустите аудит, получите Recovery-план и скачайте AI Developer Pack для построения сайта по формуле OWNDEV." />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Site Formula v2</h1>
        <p className="text-muted-foreground">
          19 вертикалей · Page Contracts · Preflight Gate ≥ 90 · AI Developer Pack (Module 9)
        </p>
      </header>

      <StageSteps stage={stage} />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stage === 'pick_type' && (
        <ProjectTypePicker
          types={types}
          grouped={groupedTypes}
          loading={typesLoading}
          onPick={handlePickType}
          selected={selectedType}
        />
      )}

      {(stage === 'fill_intake' || stage === 'auditing' || stage === 'building') && (
        <IntakeForm
          selectedType={selectedType}
          types={types}
          siteUrl={siteUrl}
          setSiteUrl={setSiteUrl}
          businessName={businessName}
          setBusinessName={setBusinessName}
          shortDesc={shortDesc}
          setShortDesc={setShortDesc}
          phone={phone}
          setPhone={setPhone}
          city={city}
          setCity={setCity}
          busy={busy}
          stage={stage}
          onBack={() => setStage('pick_type')}
          onRun={handleRunAudit}
        />
      )}

      {(stage === 'ready' || stage === 'pack_built') && audit && blueprint && (
        <ResultsPanel
          audit={audit}
          blueprint={blueprint}
          packId={packId}
          packMeta={packMeta}
          busy={busy}
          onBuildPack={handleBuildPack}
        />
      )}
    </div>
  );
}

function extractBrand(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'Бренд';
  }
}

function StageSteps({ stage }: { stage: Stage }) {
  const steps: Array<{ key: Stage[]; label: string }> = [
    { key: ['pick_type'], label: '1. Тип проекта' },
    { key: ['fill_intake'], label: '2. Данные сайта' },
    { key: ['auditing', 'building'], label: '3. Аудит' },
    { key: ['ready', 'pack_built'], label: '4. AI Developer Pack' },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {steps.map((s, i) => {
        const active = s.key.includes(stage);
        const done =
          steps.findIndex((x) => x.key.includes(stage)) > i;
        return (
          <Badge
            key={i}
            variant={active ? 'default' : done ? 'secondary' : 'outline'}
            className="text-sm py-1 px-3"
          >
            {done && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
            {s.label}
          </Badge>
        );
      })}
    </div>
  );
}

function ProjectTypePicker({
  types,
  grouped,
  loading,
  onPick,
  selected,
}: {
  types: ProjectType[];
  grouped: Record<string, ProjectType[]>;
  loading: boolean;
  onPick: (c: ProjectTypeCode) => void;
  selected: ProjectTypeCode | null;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Загрузка списка типов…</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Выберите тип проекта</CardTitle>
        <CardDescription>
          Под каждый тип привязан свой набор Page Contracts и обязательных JSON-LD.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group}>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
              {GROUP_LABELS[group] || group}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((t) => (
                <button
                  key={t.code}
                  onClick={() => onPick(t.code)}
                  className={`text-left p-4 rounded-lg border transition hover:border-primary hover:bg-muted/50 ${
                    selected === t.code ? 'border-primary bg-muted/30' : 'border-border'
                  }`}
                >
                  <div className="font-medium">{t.name_ru}</div>
                  {t.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {t.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    schemas: {t.required_schemas.slice(0, 3).join(', ')}
                    {t.required_schemas.length > 3 ? '…' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const GROUP_LABELS: Record<string, string> = {
  services: 'Услуги',
  ecommerce: 'E-commerce',
  tech: 'Технологии',
  content: 'Контент',
  education: 'Образование',
  health: 'Медицина',
  commerce: 'Торговля',
  org: 'Организации',
};

function IntakeForm(props: {
  selectedType: ProjectTypeCode | null;
  types: ProjectType[];
  siteUrl: string;
  setSiteUrl: (s: string) => void;
  businessName: string;
  setBusinessName: (s: string) => void;
  shortDesc: string;
  setShortDesc: (s: string) => void;
  phone: string;
  setPhone: (s: string) => void;
  city: string;
  setCity: (s: string) => void;
  busy: boolean;
  stage: Stage;
  onBack: () => void;
  onRun: () => void;
}) {
  const t = props.types.find((x) => x.code === props.selectedType);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные сайта</CardTitle>
        <CardDescription>
          Тип:{' '}
          <Badge variant="secondary">{t?.name_ru ?? props.selectedType}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="url">URL сайта *</Label>
          <Input
            id="url"
            placeholder="https://example.ru"
            value={props.siteUrl}
            onChange={(e) => props.setSiteUrl(e.target.value)}
            disabled={props.busy}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Название бренда</Label>
            <Input
              id="brand"
              placeholder="OWNDEV"
              value={props.businessName}
              onChange={(e) => props.setBusinessName(e.target.value)}
              disabled={props.busy}
            />
          </div>
          <div>
            <Label htmlFor="city">Город</Label>
            <Input
              id="city"
              placeholder="Москва"
              value={props.city}
              onChange={(e) => props.setCity(e.target.value)}
              disabled={props.busy}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            placeholder="+7 999 000-00-00"
            value={props.phone}
            onChange={(e) => props.setPhone(e.target.value)}
            disabled={props.busy}
          />
        </div>
        <div>
          <Label htmlFor="desc">Краткое описание</Label>
          <Textarea
            id="desc"
            placeholder="Чем занимается компания, для кого, ключевые услуги"
            value={props.shortDesc}
            onChange={(e) => props.setShortDesc(e.target.value)}
            disabled={props.busy}
            rows={3}
          />
        </div>

        {(props.stage === 'auditing' || props.stage === 'building') && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>
              {props.stage === 'auditing' ? 'Сканируем сайт…' : 'Строим Blueprint…'}
            </AlertTitle>
            <AlertDescription>
              Это занимает 30-90 секунд. Не закрывайте вкладку.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={props.onBack} disabled={props.busy}>
            Назад
          </Button>
          <Button onClick={props.onRun} disabled={props.busy || !props.siteUrl}>
            {props.busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Запустить аудит
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsPanel({
  audit,
  blueprint,
  packId,
  packMeta,
  busy,
  onBuildPack,
}: {
  audit: AuditReport;
  blueprint: BlueprintV2;
  packId: string | null;
  packMeta: { size: number; sha: string } | null;
  busy: boolean;
  onBuildPack: () => void;
}) {
  const score = blueprint.preflight.score;
  const publishable = blueprint.preflight.publishable;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Результаты аудита</CardTitle>
          <CardDescription>
            Просканировано {audit.pages_audited} из {audit.pages_total} страниц
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <ScoreTile label="Overall" value={audit.overall_score} />
            <ScoreTile label="SEO" value={audit.seo_score} />
            <ScoreTile label="GEO" value={audit.geo_score} />
            <ScoreTile label="CRO" value={audit.cro_score} />
          </div>
          <div className="text-sm text-muted-foreground">
            Контрактов: passed {audit.contracts_passed}, failed {audit.contracts_failed}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preflight Gate</CardTitle>
          <CardDescription>Минимум 90/100 для экспорта AI Developer Pack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{score}/100</div>
            {publishable ? (
              <Badge className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Готово к публикации
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" /> Ниже порога
              </Badge>
            )}
          </div>
          <Progress value={score} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Контрактов проверено: {blueprint.preflight.contracts_checked}, нарушений:{' '}
            {blueprint.preflight.violations.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Топ-проблемы</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.gaps.length === 0 ? (
            <p className="text-muted-foreground">Все страницы соответствуют контрактам.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {audit.gaps.slice(0, 8).map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge
                    variant={g.severity === 'critical' || g.severity === 'high' ? 'destructive' : 'secondary'}
                    className="mt-0.5 shrink-0"
                  >
                    {g.severity}
                  </Badge>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{g.url}</div>
                    <div>{g.message_ru}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Developer Pack (Module 9)</CardTitle>
          <CardDescription>
            ZIP с super_prompt, page_contracts, schema_pack, llms.txt, robots.txt и acceptance checklist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!packId ? (
            <>
              <p className="text-sm text-muted-foreground">
                {publishable
                  ? 'Можно собрать пак прямо сейчас.'
                  : 'Score ниже 90 — Preflight Gate заблокирует экспорт. Соберите Recovery-план и доведите score до 90+.'}
              </p>
              <Button onClick={onBuildPack} disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Собрать AI Developer Pack
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Готово</AlertTitle>
                <AlertDescription>
                  Размер: {packMeta ? Math.round(packMeta.size / 1024) : '?'} KB · sha256:{' '}
                  <code className="text-xs">{packMeta?.sha.slice(0, 16)}…</code>
                </AlertDescription>
              </Alert>
              <a
                href={formulaV2Api.aiPackDownloadUrl(packId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Скачать ZIP
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
