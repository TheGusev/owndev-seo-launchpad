/**
 * Site Formula V3 — единая страница: визуальные этапы 0-7
 *   0. Выбор типа проекта (Tier A/B/C — 27 вертикалей)
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Users,
  Briefcase,
  Check,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { saveFileForUser } from '@/lib/saveFileForUser';
import {
  formulaV3Api,
  type ProjectTypeV3,
  type ProjectTypeCodeV3,
  type PipelineResultV3,
  type ExportMode,
  type PlatformTarget,
} from '@/lib/api/formulaV3';
import {
  AUDIENCE_PRESETS,
  POPULAR_CITIES,
  TIER_TAB_LABELS,
  TIER_TAB_DESCRIPTIONS,
  getServicePresetsFor,
  getIndustryPresetsFor,
  SERVICE_PRESETS_FALLBACK,
} from '@/data/site-formula-presets';
import { getIntakeShapeFor } from '@/data/site-formula-intake-shape';
import { generateSiteFormulaProWord, type ProReportContext } from '@/lib/generateSiteFormulaProWord';
import { generateSiteFormulaProPdf } from '@/lib/generateSiteFormulaProPdf';
import { generateDirectExportXlsx } from '@/lib/site-formula-v3/generateDirectExportXlsx';
import { ProReportPanel } from '@/components/site-formula-v3/ProReportPanel';
import { getSession as getV1Session } from '@/lib/api/siteFormula';

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

/** Карточки формата пакета — язык понятный обывателю, без JSON-жаргона. */
const PACK_MODES: Array<{
  value: ExportMode;
  title: string;
  short: string;     // короткий подзаголовок («для кого»)
  desc: string;     // основное описание
  bullets: string[]; // что внутри
  icon: any;
  recommended?: boolean;
}> = [
  {
    value: 'structured',
    title: 'Универсальный пакет',
    short: 'Для любых AI-инструментов и ориентир для команды',
    desc: 'Структурированный пакет из JSON + Markdown-файлов по разделам. Подходит большинству.',
    bullets: [
      'Машиночитаемая спецификация проекта',
      'Отдельные файлы на каждый раздел (роль, роуты, контракты)',
      'Работает с любым AI-конструктором',
    ],
    icon: Layers3,
    recommended: true,
  },
  {
    value: 'full',
    title: 'Один большой файл',
    short: 'Для быстрой передачи в ChatGPT/Claude',
    desc: 'Всё ТЗ в одном JSON-файле — удобно вставить в чат одним куском.',
    bullets: [
      'Один файл super_prompt_pack.json',
      'Ничего не нужно распаковывать',
      'Можно скинуть любому AI-ассистенту',
    ],
    icon: FileJson,
  },
  {
    value: 'platform_specific',
    title: 'Под конкретный AI-конструктор',
    short: 'Если вы уже выбрали Lovable / Cursor / v0 / Claude Code / Antigravity',
    desc: 'Специальные файлы и формат промпта под вашу платформу.',
    bullets: [
      'Правильные имена и пути файлов (.cursor/rules, .antigravity/...)',
      'Оптимизированный формат промпта под выбранный инструмент',
      'Ниже нужно выбрать платформу',
    ],
    icon: FileText,
  },
  {
    value: 'studio',
    title: 'Для разработчика / студии',
    short: 'Когда сайт будет делать человек, а не AI',
    desc: 'Читаемое ТЗ в PDF/Word — можно прямо отправить в студию или фрилансеру.',
    bullets: [
      'Техническое_задание.html (открывается в Word, печатается в PDF)',
      'Структурированное ТЗ из 8 разделов',
      'Исходный Markdown для редактирования',
    ],
    icon: Briefcase,
  },
];

/** Платформы для platform_specific — с Antigravity. */
const PLATFORMS: Array<{ v: PlatformTarget; label: string; desc: string }> = [
  { v: 'lovable', label: 'Lovable', desc: 'Один промпт + JSON' },
  { v: 'cursor', label: 'Cursor', desc: '.cursor/rules + TASKS.md' },
  { v: 'v0', label: 'v0 by Vercel', desc: 'Component-first prompt' },
  { v: 'claude_code', label: 'Claude Code', desc: 'CLAUDE.md + sub-agents' },
  { v: 'antigravity', label: 'Antigravity', desc: '.antigravity/rules.md' },
  { v: 'raw', label: 'Raw', desc: 'Без адаптации' },
];

export default function SiteFormulaV3() {
  const isMobile = useIsMobile();
  const [stage, setStage] = useState<Stage>('pick_type');
  const [types, setTypes] = useState<ProjectTypeV3[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ProjectTypeCodeV3 | null>(null);

  const [siteUrl, setSiteUrl] = useState('');
  const [noDomain, setNoDomain] = useState(false); // "У меня ещё нет домена"
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [industryOpen, setIndustryOpen] = useState(false);
  const [audienceChips, setAudienceChips] = useState<string[]>([]);
  const [audienceCustom, setAudienceCustom] = useState('');
  // Города — мульти-выбор (чипы) + опц. свободный ввод.
  const [cities, setCities] = useState<string[]>([]);
  const [cityOpen, setCityOpen] = useState(false);

  // PR-30: сортировка городов по алфавиту с пиннингом Москвы и СПб наверх.
  // Так пользователю проще найти нужный город (раньше был приоритет по
  // населению, что нелогично для поиска).
  const POPULAR_CITIES_SORTED = useMemo(() => {
    const pinned = ['Москва', 'Санкт-Петербург'];
    const rest = POPULAR_CITIES
      .filter((c) => !pinned.includes(c))
      .sort((a, b) => a.localeCompare(b, 'ru'));
    return [...pinned.filter((c) => POPULAR_CITIES.includes(c)), ...rest];
  }, []);
  const [cityCustom, setCityCustom] = useState('');
  // Список услуг/направлений — свободный текст через запятую/перенос строк.
  // Кнопочные пресеты услуг (по вертикали) + опц. свободный ввод.
  const [serviceChips, setServiceChips] = useState<string[]>([]);
  const [servicesText, setServicesText] = useState('');
  const [servicesOpen, setServicesOpen] = useState(false); // блок услуг свёрнут по умолчанию
  const [packMode, setPackMode] = useState<ExportMode>('structured');
  const [platform, setPlatform] = useState<PlatformTarget>('lovable');

  const [result, setResult] = useState<PipelineResultV3 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | 'zip' | 'xlsx' | null>(null);
  // PR-16: engine_state из активной v1 free-сессии (если есть).
  // Используется как мост v1→v3, чтобы PRO-отчёт содержал KEY DECISIONS
  // и project_class из ядра v1. Если v1-сессии нет — undefined, всё работает как раньше.
  const [v1EngineState, setV1EngineState] = useState<Record<string, any> | null>(null);

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

  // PR-16: подгружаем engine_state из активной v1 free-сессии (если есть).
  // Тихо, без тоста: это бонусный мост, не критический функционал.
  useEffect(() => {
    const sid = typeof window !== 'undefined' ? localStorage.getItem('owndev_sf_session_id') : null;
    if (!sid) return;
    getV1Session(sid)
      .then((s) => {
        if (s && s.engine_state) setV1EngineState(s.engine_state);
      })
      .catch(() => {
        // нет сессии или истекла — игнорируем
      });
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

  // Динамическое количество типов (подхватывает любые новые ниши без правки hero-текста).
  // Фоллбэк 27 — на случай если список ещё не загружен.
  const typesCount = types.length || 27;

  function handlePickType(code: ProjectTypeCodeV3) {
    // При смене типа проекта сбрасываем весь состояние Шага 2 — пресеты
    // индустрии, аудитории, города и услуги у каждой вертикали свои. Без сброса юзер
    // видит старые выборы от предыдущего типа (например "МФО" в интернет-магазине).
    if (code !== selectedType) {
      setServiceChips([]);
      setServicesText('');
      setIndustry('');
      setAudienceChips([]);
      setAudienceCustom('');
      setCities([]);
      setCityCustom('');
    }
    setSelectedType(code);
    setStage('fill_intake');
  }

  async function handleRun() {
    if (!selectedType) {
      toast.error('Сначала выберите тип проекта');
      return;
    }
    if (!brandName) {
      toast.error('Укажите название бренда');
      return;
    }
    if (!noDomain && !siteUrl) {
      toast.error('Укажите URL сайта или отметьте «У меня ещё нет домена»');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    setStage('running');
    try {
      // Целевая аудитория = чипы + кастомное поле, объединённые через запятую.
      const audienceParts = [
        ...audienceChips,
        ...(audienceCustom.trim() ? [audienceCustom.trim()] : []),
      ];
      const targetAudience =
        audienceParts.length > 0
          ? audienceParts.join(', ')
          : 'целевая аудитория проекта';
      // Объединяем выбранные чипы + свободный ввод (разбиваем по запятым).
      const customCities = cityCustom
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      // Для типов без геобинда (media/blog/saas/mobile_app/b2b_media) поле городов
      // в UI скрыто — сбрасываем любое остаточное значение (юзер мог выбрать
      // города до смены типа), чтобы не ломать demand-pipeline.
      const shapeForSubmit = getIntakeShapeFor(selectedType);
      const allCities = shapeForSubmit.showCities
        ? Array.from(new Set([...cities, ...customCities]))
        : [];
      const primaryCity = allCities[0]; // первый выбранный — основной
      // Список услуг — выбранные кнопки-пресеты + свободный текст (через запятые/строки).
      const customServices = servicesText
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const services = Array.from(new Set([...serviceChips, ...customServices]));

      // PR-11: Структурируем cities/service_directions для fan-out.
      // Слугификация — латиница с проверкой кириллицы → транслит.
      const TRANSLIT: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
        з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
        п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
        ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
      };
      const slugify = (s: string): string =>
        s.toLowerCase().trim()
          .split('').map((ch) => TRANSLIT[ch] ?? ch).join('')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-').replace(/-+/g, '-')
          .slice(0, 40) || 'item';

      const structuredCities = allCities.map((label) => ({ slug: slugify(label), label }));
      const structuredDirections = services.map((label) => ({ slug: slugify(label), label }));

      const r = await formulaV3Api.runPipeline({
        root_url: noDomain ? undefined : normalizeUrl(siteUrl),
        project_code: selectedType,
        brand: {
          name: brandName,
          industry: industry || 'услуги',
          target_audience: targetAudience,
          primary_city: primaryCity,
          // Дополнительные города + список услуг — досылаем в competitive_position
          // (бэк использует этот контекст для LLM стратегии и seed-ключей).
          ...(allCities.length > 1 || services.length > 0
            ? {
                competitive_position: [
                  allCities.length > 1
                    ? `Города работы: ${allCities.join(', ')}`
                    : '',
                  services.length > 0 ? `Услуги/направления: ${services.join(', ')}` : '',
                ]
                  .filter(Boolean)
                  .join('. '),
              }
            : {}),
        },
        // Seed-ключи бэк собирает сам, но если юзер ввёл услуги — используем их как seed.
        seed_keywords:
          services.length > 0
            ? services.flatMap((s) =>
                allCities.length > 0 ? allCities.map((c) => `${s} ${c.toLowerCase()}`) : [s]
              )
            : undefined,
        // PR-11: структурированные поля для page fan-out (бэк развернёт посадки по городам × направлениям).
        cities: structuredCities.length > 0 ? structuredCities : undefined,
        service_directions: structuredDirections.length > 0 ? structuredDirections : undefined,
        enable_hub_pages: true,
        pack_mode: packMode,
        platform_target: packMode === 'platform_specific' ? platform : undefined,
        ai_training_policy: 'allow_with_attribution',
        max_crawl_pages: 20,
        // PR-16 мост v1→v3: пробрасываем engine_state, если у пользователя
        // была free-сессия SiteFormula. Бэк подмешает project_class + decision_trace
        // в pro_report, благодаря чему PRO-PDF получит раздел KEY DECISIONS.
        engine_state: v1EngineState ?? undefined,
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

  // iOS Safari игнорирует <a download> — общий хелпер `saveFileForUser`
  // на iPhone сначала пробует Web Share API, иначе открывает Blob в новой
  // вкладке (юзер сохраняет через Поделиться → Файлы).
  async function downloadBlob(blob: Blob, filename: string): Promise<'share' | 'download' | 'open'> {
    return saveFileForUser(blob, filename);
  }

  function buildProContext(): ProReportContext | null {
    if (!result || !selectedType) return null;
    const customCities = cityCustom.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    // Аналогично сабмиту: для типов без геобинда в отчёт города не попадают.
    const shapeForReport = getIntakeShapeFor(selectedType);
    const allCities = shapeForReport.showCities
      ? Array.from(new Set([...cities, ...customCities]))
      : [];
    const customServices = servicesText.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const services = Array.from(new Set([...serviceChips, ...customServices]));
    return {
      result,
      brand: {
        name: brandName || 'Бренд',
        industry: industry || 'услуги',
        primary_city: allCities[0],
        cities: allCities,
        services,
        project_code: selectedType,
        project_label: types.find((tt) => tt.code === selectedType)?.name_ru,
      },
    };
  }

  function safeFilename(): string {
    const slug = (brandName || 'site-formula-pro')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'site-formula-pro';
    return `${slug}-pro`;
  }

  async function handleDownloadDocx() {
    const ctx = buildProContext();
    if (!ctx) return;
    setDownloading('docx');
    try {
      const blob = await generateSiteFormulaProWord(ctx);
      const mode = await downloadBlob(blob, `${safeFilename()}.docx`);
      if (mode === 'open') {
        toast.success('Word-отчёт готов', {
          description: 'Файл открыт в новой вкладке. Нажмите иконку Поделиться → Сохранить в Файлы',
        });
      } else {
        toast.success('Word-отчёт скачан');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Не удалось сформировать Word: ${e.message ?? e}`);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadPdf() {
    const ctx = buildProContext();
    if (!ctx) return;
    setDownloading('pdf');
    try {
      const blob = await generateSiteFormulaProPdf(ctx);
      const mode = await downloadBlob(blob, `${safeFilename()}.pdf`);
      if (mode === 'open') {
        toast.success('PDF-отчёт готов', {
          description: 'Файл открыт в новой вкладке. Нажмите иконку Поделиться → Сохранить в Файлы',
        });
      } else {
        toast.success('PDF-отчёт скачан');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Не удалось сформировать PDF: ${e.message ?? e}`);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadZip() {
    if (!result?.job_id) return;
    setDownloading('zip');
    try {
      const url = formulaV3Api.getPackZipUrl(result.job_id);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const mode = await downloadBlob(blob, `${safeFilename()}-pack.zip`);
      if (mode === 'open') {
        toast.success('ZIP-пакет готов', {
          description: 'Файл открыт в новой вкладке. Нажмите иконку Поделиться → Сохранить в Файлы',
        });
      } else {
        toast.success('ZIP-пакет скачан');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Не удалось скачать ZIP: ${e.message ?? e}`);
    } finally {
      setDownloading(null);
    }
  }

  // PR-26: экспорт готовых групп Я.Директа в XLSX.
  async function handleDownloadDirectXlsx() {
    const r = result as any;
    const clusters = r?.demand?.clusters as any[] | undefined;
    if (!clusters || clusters.length === 0) {
      toast.error('Нет данных Wordstat — экспорт Я.Директа недоступен');
      return;
    }
    setDownloading('xlsx');
    try {
      const customCities = cityCustom.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      const allCities = Array.from(new Set([...cities, ...customCities]));
      const { blob, filename } = await generateDirectExportXlsx(clusters, {
        brand: brandName || undefined,
        cityName: allCities[0],
        vertical: industry || undefined,
        data_source: r?.demand?.data_source,
      });
      const mode = await downloadBlob(blob, filename);
      if (mode === 'open') {
        toast.success('XLSX готов', {
          description: 'Файл открыт в новой вкладке. Нажмите иконку Поделиться → Сохранить в Файлы',
        });
      } else {
        toast.success('XLSX для Я.Директа скачан');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Не удалось сформировать XLSX: ${e.message ?? e}`);
    } finally {
      setDownloading(null);
    }
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
          content="Site Formula PRO — 27 типов проекта, спрос из Wordstat, техпаспорт (llms.txt + 17 AI-ботов), Preflight 4-осей и super_prompt_pack для Lovable / Cursor / v0 / Claude Code."
        />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20 overflow-x-hidden">
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
              <span className="pro-shimmer-text">
                PRO
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {typesCount} типов проекта, спрос из Wordstat, технический паспорт (llms.txt + 17 AI-ботов),
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
            <CardTitle>Шаг 1. Что мы собираем?</CardTitle>
            <CardDescription>
              Выберите категорию вашего проекта — от этого зависит структура ТЗ и аудит 4-осей
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загружаем типы проектов…
              </div>
            ) : (
              <Tabs defaultValue="A">
                <TabsList className="grid grid-cols-3 w-full h-auto gap-1 p-1">
                  <TabsTrigger value="A" className="pro-tab text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight">
                    {TIER_TAB_LABELS.A}
                  </TabsTrigger>
                  <TabsTrigger value="B" className="pro-tab text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight">
                    {TIER_TAB_LABELS.B}
                  </TabsTrigger>
                  <TabsTrigger value="C" className="pro-tab text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight">
                    {TIER_TAB_LABELS.C}
                  </TabsTrigger>
                </TabsList>
                {(['A', 'B', 'C'] as const).map((tier) => (
                  <TabsContent key={tier} value={tier}>
                    <p className="text-sm text-muted-foreground mt-3 mb-1">
                      {TIER_TAB_DESCRIPTIONS[tier]}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {(groupedByTier[tier] ?? []).map((t) => {
                        const isSelected = selectedType === t.code;
                        return (
                          <button
                            key={t.code}
                            onClick={() => handlePickType(t.code)}
                            className={`pro-card text-left rounded-lg p-4 bg-card${
                              isSelected ? ' is-selected' : ''
                            }`}
                          >
                            <div className="font-semibold mb-1">{t.name_ru}</div>
                            {t.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                            )}
                          </button>
                        );
                      })}
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
            <CardTitle>Шаг 2. Расскажите о проекте</CardTitle>
            <CardDescription>
              Тип проекта:{' '}
              <span className="font-medium text-foreground">
                {types.find((tt) => tt.code === selectedType)?.name_ru ?? selectedType}
              </span>{' '}
              <Button variant="link" size="sm" onClick={() => setStage('pick_type')}>сменить</Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Блок 1: Бренд + Домен */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Название бренда / компании *</Label>
                <Input
                  id="brand"
                  placeholder="ООО «Пример» или «Моя Студия»"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="url" className={noDomain ? 'text-muted-foreground' : ''}>
                  URL сайта {!noDomain && '*'}
                </Label>
                <Input
                  id="url"
                  placeholder="example.ru или https://example.ru"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  disabled={noDomain}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="no-domain"
                    checked={noDomain}
                    onCheckedChange={(v) => setNoDomain(v === true)}
                  />
                  <label htmlFor="no-domain" className="text-xs text-muted-foreground cursor-pointer select-none">
                    У меня ещё нет домена — соберём ТЗ без сбора сайта
                  </label>
                </div>
                {!noDomain && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Можно без https:// — добавим автоматически. Кириллица поддерживается.
                  </p>
                )}
              </div>
            </div>

            {/* Блок 2: Отрасль + Города — видимость/лейблы по shape типа проекта */}
            {(() => {
              const shape = getIntakeShapeFor(selectedType);
              const filteredIndustryPresets = getIndustryPresetsFor(selectedType);
              return (
            <div className={`grid grid-cols-1 ${shape.showCities ? 'md:grid-cols-2' : ''} gap-4`}>
              <div>
                <Label>{shape.industryLabel}</Label>
                <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className={industry ? 'text-foreground' : 'text-muted-foreground'}>
                        {industry || shape.industryPlaceholder}
                      </span>
                      <Briefcase className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 z-[60]"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    avoidCollisions={false}
                  >
                    <Command
                      filter={(value, search) => {
                        if (!search) return 1;
                        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput
                        placeholder="Найти или ввести свою…"
                        value={industry}
                        onValueChange={setIndustry}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded"
                            onClick={() => setIndustryOpen(false)}
                          >
                            Использовать «<span className="font-semibold">{industry}</span>» как свой вариант
                          </button>
                        </CommandEmpty>
                        <CommandGroup heading={`Популярные варианты (${filteredIndustryPresets.length})`}>
                          {filteredIndustryPresets.map((p) => (
                            <CommandItem
                              key={p.label}
                              value={p.label}
                              onSelect={(v) => {
                                setIndustry(v);
                                setIndustryOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  industry === p.label ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {p.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  {shape.industryHint}
                </p>
              </div>
              {shape.showCities && (
              <div>
                <Label>
                  {shape.citiesLabel}{' '}
                  <span className="text-muted-foreground font-normal">
                    {shape.citiesOptional ? '(опционально)' : '(можно несколько)'}
                  </span>
                </Label>
                {/* PR-16: на мобилке — bottom-sheet (Drawer/vaul) вместо Popover.
                    Это убирает прыжки popover'а и наезд хедера при открытии iOS-клавиатуры. */}
                {isMobile ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                      onClick={() => setCityOpen(true)}
                    >
                      <span className={cities.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                        {cities.length === 0
                          ? 'Выбрать из списка…'
                          : `Выбрано городов: ${cities.length}`}
                      </span>
                      <Globe className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                    <Drawer
                      open={cityOpen}
                      onOpenChange={setCityOpen}
                      shouldScaleBackground={false}
                    >
                      <DrawerContent className="z-[80] max-h-[85vh] flex flex-col">
                        <DrawerHeader className="text-left pb-2">
                          <DrawerTitle>Города работы</DrawerTitle>
                          <DrawerDescription>
                            Выбрано: {cities.length} · можно несколько
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <Command
                            filter={(value, search) => {
                              if (!search) return 1;
                              return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                            }}
                          >
                            <CommandInput placeholder="Найти город…" />
                            <CommandList className="max-h-[55vh]">
                              <CommandEmpty className="text-xs text-muted-foreground p-3">
                                Ничего не найдено — добавьте вручную в поле ниже.
                              </CommandEmpty>
                              <CommandGroup heading={`Города РФ · клик для выбора (${POPULAR_CITIES_SORTED.length})`}>
                                {POPULAR_CITIES_SORTED.map((c) => {
                                  const checked = cities.includes(c);
                                  return (
                                    <CommandItem
                                      key={c}
                                      value={c}
                                      onSelect={() => {
                                        setCities((prev) =>
                                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                                        );
                                      }}
                                    >
                                      <Checkbox checked={checked} className="mr-2 pointer-events-none" tabIndex={-1} />
                                      {c}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>
                        <div
                          className="flex justify-between gap-2 p-3 border-t bg-background"
                          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCities([])}
                            disabled={cities.length === 0}
                          >
                            Очистить
                          </Button>
                          <Button size="sm" onClick={() => setCityOpen(false)}>
                            Готово
                          </Button>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </>
                ) : (
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className={cities.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                          {cities.length === 0
                            ? 'Выбрать из списка…'
                            : `Выбрано городов: ${cities.length}`}
                        </span>
                        <Globe className="h-4 w-4 opacity-50 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0 z-[60]"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      avoidCollisions={false}
                    >
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1;
                          return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                        }}
                      >
                        <CommandInput placeholder="Найти город…" />
                        <CommandList>
                          <CommandEmpty className="text-xs text-muted-foreground p-3">
                            Ничего не найдено — добавьте вручную в поле ниже.
                          </CommandEmpty>
                          <CommandGroup heading={`Города РФ · клик для выбора (${POPULAR_CITIES_SORTED.length})`}>
                            {POPULAR_CITIES_SORTED.map((c) => {
                              const checked = cities.includes(c);
                              return (
                                <CommandItem
                                  key={c}
                                  value={c}
                                  onSelect={() => {
                                    setCities((prev) =>
                                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                                    );
                                  }}
                                >
                                  <Checkbox checked={checked} className="mr-2 pointer-events-none" tabIndex={-1} />
                                  {c}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="flex justify-between p-2 border-t">
                        <Button variant="ghost" size="sm" onClick={() => setCities([])} disabled={cities.length === 0}>
                          Очистить
                        </Button>
                        <Button size="sm" onClick={() => setCityOpen(false)}>Готово</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {/* Выбранные города чипами */}
                {cities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cities.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 text-primary px-2 py-0.5 text-xs"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => setCities((prev) => prev.filter((x) => x !== c))}
                          className="hover:bg-primary/20 rounded-full -mr-1 ml-0.5"
                          aria-label={`Убрать ${c}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  className="mt-2"
                  placeholder="Добавить свои через запятую: Новороссийск, Анапа…"
                  value={cityCustom}
                  onChange={(e) => setCityCustom(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {shape.citiesHint}
                </p>
              </div>
              )}
            </div>
              );
            })()}

            {/* Блок 2.5: Услуги / направления — СВЁРНУТ по умолчанию (опционально); лейблы по shape */}
            {(() => {
              const shape = getIntakeShapeFor(selectedType);
              return (
            <div className="rounded-lg border border-dashed border-border bg-muted/20">
              <button
                type="button"
                onClick={() => setServicesOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors rounded-lg"
              >
                <span className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {shape.servicesBlockLabel}
                    <span className="text-muted-foreground font-normal"> · опционально</span>
                  </span>
                  {serviceChips.length > 0 && (
                    <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                      {serviceChips.length}
                    </Badge>
                  )}
                </span>
                <ArrowRight className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-90' : ''}`} />
              </button>
              {!servicesOpen && (
                <p className="px-4 pb-3 -mt-1 text-xs text-muted-foreground">
                  Формула уже знает ваш тип проекта — она сама подберёт семантику.
                  Откройте блок, если хотите сузить фокус.
                </p>
              )}
              {servicesOpen && (
                <div className="px-4 pb-4 pt-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    {shape.servicesPresetHint}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getServicePresetsFor(selectedType).map((s) => {
                      const active = serviceChips.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setServiceChips((prev) =>
                              prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                            active
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {active ? <Check className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
                          {s}
                          {active && <X className="h-3 w-3 opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    id="services-custom"
                    placeholder={shape.servicesCustomPlaceholder}
                    value={servicesText}
                    onChange={(e) => setServicesText(e.target.value)}
                    className="mt-3 min-h-[60px] resize-y break-words"
                    rows={2}
                  />
                  {(() => {
                    // PR-24: inline autocomplete под textarea «Услуги».
                    // Парсим последний фрагмент после ,/;/\n и фильтруем
                    // пресеты ниши + общий fallback по подстроке (case-insensitive).
                    const lastSepIdx = Math.max(
                      servicesText.lastIndexOf(','),
                      servicesText.lastIndexOf(';'),
                      servicesText.lastIndexOf('\n'),
                    );
                    const fragment = servicesText.slice(lastSepIdx + 1).trim();
                    if (fragment.length < 2) return null;
                    const needle = fragment.toLowerCase();
                    const pool = Array.from(
                      new Set([
                        ...getServicePresetsFor(selectedType),
                        ...SERVICE_PRESETS_FALLBACK,
                      ]),
                    );
                    const matches = pool
                      .filter((s) => s.toLowerCase().includes(needle) && !serviceChips.includes(s))
                      .slice(0, 8);
                    if (matches.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <p className="text-[11px] text-muted-foreground mb-1.5">
                          Подсказки от формулы — нажмите, чтобы добавить
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {matches.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setServiceChips((prev) => Array.from(new Set([...prev, m])));
                                setServicesText((prev) => {
                                  const i = Math.max(
                                    prev.lastIndexOf(','),
                                    prev.lastIndexOf(';'),
                                    prev.lastIndexOf('\n'),
                                  );
                                  // Сохраняем разделитель и пробел после него, обрезаем недопечатанный фрагмент.
                                  return i >= 0 ? prev.slice(0, i + 1) + ' ' : '';
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Sparkles className="h-3 w-3" />
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
              );
            })()}

            {/* Блок 3: Целевая аудитория чипами */}
            <div>
              <Label>Кто ваши клиенты? <span className="text-muted-foreground font-normal">(можно несколько)</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AUDIENCE_PRESETS.map((a) => {
                  const active = audienceChips.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        setAudienceChips((prev) =>
                          prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {active ? <Check className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {a}
                      {active && <X className="h-3 w-3 opacity-60" />}
                    </button>
                  );
                })}
              </div>
              <Textarea
                className="mt-2 min-h-[60px] resize-y break-words"
                placeholder="Своё описание аудитории (опц.) — напр. «владельцы кафе в спальных районах»"
                value={audienceCustom}
                onChange={(e) => setAudienceCustom(e.target.value)}
                rows={2}
              />
            </div>

            {/* Блок 4: Формат пакета */}
            <div className="pt-3 border-t space-y-3">
              <div>
                <Label className="text-base">Что вы хотите получить на выходе?</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Выберите формат выходных файлов — их мы отдадим в ZIP-архиве после аудита.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PACK_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = packMode === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPackMode(m.value)}
                        className={`text-left rounded-lg border p-4 transition-colors hover:border-primary/60 flex flex-col h-full ${
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
                        <div className="text-xs text-muted-foreground italic mb-2">{m.short}</div>
                        <div className="text-xs text-muted-foreground mb-2">{m.desc}</div>
                        <ul className="mt-auto space-y-1">
                          {m.bullets.map((b) => (
                            <li key={b} className="text-[11px] text-muted-foreground flex items-start gap-1">
                              <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/60" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setPlatform(p.v)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors text-left ${
                          platform === p.v
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="font-medium">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              {/* PR-14: обе кнопки одинаковой высоты (h-12) и идентичных в mobile-stack. */}
              <Button
                variant="outline"
                onClick={() => setStage('pick_type')}
                className="sm:order-1 h-12 text-base font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Назад
              </Button>
              <Button
                onClick={handleRun}
                disabled={busy || !brandName || (!noDomain && !siteUrl)}
                className="gap-2 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90 sm:order-2 flex-1 h-12 text-base font-medium"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {!busy && <Crown className="h-4 w-4" />}
                Запустить PRO pipeline
                <ArrowRight className="h-4 w-4" />
              </Button>
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
              {/* Timeline: горизонтальная полоса с точками + компактные строки.
                  PR-16 заменил квадратные stage-карточки. */}
              {(() => {
                const stageKeys = Object.keys(STAGE_LABELS) as StageKey[];
                const r = result as any;
                const computeState = (key: StageKey) => {
                  const stageInfo = result?.stages.find((s) => s.stage === key);
                  let skipped = false;
                  if (stageInfo?.ok === true) {
                    if (key === 'demand' && (!r?.demand || (r?.demand?.clusters?.length ?? 0) === 0)) skipped = true;
                    if (key === 'crawl' && (!r?.crawl_pages || r?.crawl_pages.length === 0)) skipped = true;
                    if (key === 'audit' && (!r?.preflight_per_page || r?.preflight_per_page.length === 0)) skipped = true;
                    if (key === 'preflight' && (!r?.preflight_rollup)) skipped = true;
                  }
                  const done = stageInfo?.ok === true && !skipped;
                  const failed = stageInfo?.ok === false;
                  const inProgress = stage === 'running' && !stageInfo;
                  const statusLabel = failed
                    ? 'Ошибка'
                    : skipped
                      ? 'Пропущено'
                      : done
                        ? 'Готово'
                        : inProgress
                          ? 'Идёт…'
                          : 'Ожидание';
                  const hint = skipped && key === 'demand'
                    ? 'Выберите услуги и город для реального Wordstat'
                    : skipped && (key === 'crawl' || key === 'audit')
                      ? 'Без URL сайта'
                      : skipped && key === 'preflight'
                        ? 'Нет страниц для проверки'
                        : null;
                  const ms = stageInfo?.duration_ms;
                  return { stageInfo, done, failed, skipped, inProgress, statusLabel, hint, ms };
                };
                const states = stageKeys.map((k) => ({ key: k, ...computeState(k) }));
                const completedCount = states.filter((s) => s.done || s.skipped || s.failed).length;
                const progressPct = Math.round((completedCount / states.length) * 100);

                const demandSkipped = states.some((s) => s.key === 'demand' && s.skipped);

                return (
                  <div className="space-y-4">
                    {/* Заметный warning, если Wordstat пропущен — иначе юзер
                        не понимает, почему отчёт без реального спроса. */}
                    {demandSkipped && (
                      <Alert className="border-yellow-500/50 bg-yellow-500/10 text-foreground">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                          Wordstat пропущен
                        </AlertTitle>
                        <AlertDescription>
                          Спрос не подтянулся, потому что услуги не выбраны из справочника.
                          Перезапустите аудит, выбрав конкретные услуги из списка.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Горизонтальная полоса прогресса с точками */}
                    <div className="relative pt-2">
                      <div className="relative h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-[width] duration-500 ease-out"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="absolute inset-x-0 top-0 flex justify-between">
                        {states.map((s) => {
                          const dotColor = s.failed
                            ? 'bg-red-500 ring-red-500/20'
                            : s.skipped
                              ? 'bg-amber-400 ring-amber-400/20'
                              : s.done
                                ? 'bg-primary ring-primary/30'
                                : s.inProgress
                                  ? 'bg-primary ring-primary/40 animate-pulse'
                                  : 'bg-muted-foreground/30 ring-muted-foreground/10';
                          return (
                            <div key={s.key} className="flex flex-col items-center -mt-1.5">
                              <span
                                className={`block h-3 w-3 rounded-full ring-4 ${dotColor}`}
                                aria-label={`${STAGE_LABELS[s.key].ru} — ${s.statusLabel}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Компактный список строк: stage · status · ms */}
                    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                      {states.map((s) => {
                        const Icon = STAGE_LABELS[s.key].icon;
                        const statusColor = s.failed
                          ? 'text-red-600'
                          : s.skipped
                            ? 'text-amber-600'
                            : s.done
                              ? 'text-green-600'
                              : s.inProgress
                                ? 'text-primary'
                                : 'text-muted-foreground';
                        return (
                          <li
                            key={s.key}
                            className="flex items-center gap-3 px-3 py-2 sm:px-4 min-h-[40px] hover:bg-muted/30 transition-colors"
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${statusColor}`} />
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {STAGE_LABELS[s.key].ru}
                            </span>
                            {s.inProgress && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            )}
                            <span className={`text-xs font-medium ${statusColor}`}>
                              {s.statusLabel}
                            </span>
                            {typeof s.ms === 'number' && s.ms > 0 && (
                              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-14 text-right">
                                {s.ms} мс
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* Подсказки только для skipped (ниже списка, чтобы не ломать строй) */}
                    {states.some((s) => s.skipped && s.hint) && (
                      <div className="space-y-1 px-1">
                        {states
                          .filter((s) => s.skipped && s.hint)
                          .map((s) => (
                            <p key={s.key} className="text-[11px] text-muted-foreground leading-snug">
                              <span className="font-medium text-amber-600">{STAGE_LABELS[s.key].ru}:</span>{' '}
                              {s.hint}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })()}
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

          {result?.pro_report && <ProReportPanel report={result.pro_report} />}

          {(stage === 'done' || stage === 'failed') && result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {stage === 'done' ? 'Отчёт и Developer Pack готовы' : 'Частичный отчёт доступен'}
                </CardTitle>
                <CardDescription>
                  {stage === 'failed' && (
                    <>Pipeline завершился с ошибкой, но вы можете скачать промежуточные данные в Word или PDF. </>
                  )}
                  {result.pack && <>Версия {result.pack.version} · режим {result.pack.export_mode ?? packMode}</>}
                  {result.pack_zip_size != null && ` · ZIP ${(result.pack_zip_size / 1024).toFixed(1)} KB`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stage === 'done'
                      ? 'Основной формат для чтения — Word или PDF. ZIP-архив с машиночитаемыми файлами — справа, если отдаёте в AI-конструктор или разработчику.'
                      : 'Word/PDF собираются из тех секций, которые успели пройти. Если ZIP-пакет не сформировался — кнопки ZIP не будет.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleDownloadDocx}
                      disabled={downloading !== null}
                      className="gap-2 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90"
                    >
                      {downloading === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      Скачать Word
                    </Button>
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={downloading !== null}
                      variant="outline"
                      className="gap-2"
                    >
                      {downloading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      Скачать PDF
                    </Button>
                    {result.pack && (
                      <Button
                        onClick={handleDownloadZip}
                        disabled={downloading !== null}
                        variant="ghost"
                        className="gap-2"
                        title="Машиночитаемый пакет для AI-конструкторов / разработчиков"
                      >
                        {downloading === 'zip' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        ZIP для AI/разработчика
                      </Button>
                    )}
                    {(result as any)?.demand?.clusters?.length > 0 && (
                      <Button
                        onClick={handleDownloadDirectXlsx}
                        disabled={downloading !== null}
                        variant="outline"
                        className="gap-2"
                        title="Готовые группы объявлений Я.Директа из кластеров спроса"
                      >
                        {downloading === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Экспорт в Я.Директ (XLSX)
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { setStage('pick_type'); setResult(null); }}>
                      Новый проект
                    </Button>
                  </div>
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
