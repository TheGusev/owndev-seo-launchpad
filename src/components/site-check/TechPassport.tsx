import { AlertTriangle, Info, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TechPassportProps {
  data: {
    tech: {
      cms: string | null; cms_version: string | null; framework: string | null;
      rendering: string; server: string | null; server_version: string | null;
      cdn: string | null; analytics: string[]; analytics_ids: Record<string, string>;
      crm_widgets: string[]; cms_confidence: string; is_spa: boolean;
    };
    whois: {
      registrar: string | null; created_date: string | null; expiry_date: string | null;
      days_until_expiry: number | null; nameservers: string[]; status: string | null;
    } | null;
    geoip: {
      ip_address: string; country: string | null; country_code: string;
      country_flag: string; city: string | null; hosting_provider: string | null;
    } | null;
  };
}

const ICON_MAP: Record<string, string> = {
  WordPress: "wordpress", Tilda: "tilda", Bitrix: "bitrix24", Wix: "wix",
  Shopify: "shopify", React: "react", "Vue.js": "vuedotjs", "Next.js": "nextdotjs",
  "Nuxt.js": "nuxtdotjs", Angular: "angular", Nginx: "nginx", Apache: "apache",
  Cloudflare: "cloudflare",
};

const TechIcon = ({ name }: { name: string | null }) => {
  if (!name) return null;
  const slug = ICON_MAP[name];
  if (!slug) return null;
  return <img src={`https://cdn.simpleicons.org/${slug}`} width={16} height={16} alt={name} className="inline-block" loading="lazy" />;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateStr; }
}

function expiryBadge(days: number | null) {
  if (days === null) return null;
  if (days < 30) return <span className="text-destructive font-medium">🔴 {days} дн.</span>;
  if (days < 90) return <span className="text-yellow-500 font-medium">🟡 {days} дн.</span>;
  return <span className="text-success font-medium">🟢 {days} дн.</span>;
}

const FoundBadge = ({ found }: { found: boolean }) =>
  found
    ? <Check className="w-3.5 h-3.5 text-emerald-500 inline-block" />
    : <X className="w-3.5 h-3.5 text-muted-foreground/40 inline-block" />;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <tr className="border-b border-border/10 last:border-b-0">
    <td className="py-1.5 pr-4 text-[13px] text-muted-foreground whitespace-nowrap min-w-[140px]">{label}</td>
    <td className="py-1.5 text-[13px] font-medium text-foreground">{children || "—"}</td>
  </tr>
);

const SectionDivider = () => (
  <tr><td colSpan={2} className="py-1"><div className="border-b border-border/20" /></td></tr>
);

const TechPassport = ({ data }: TechPassportProps) => {
  const { tech, whois, geoip } = data;

  const recommendations: { type: "warning" | "critical" | "info"; text: string }[] = [];
  if (tech.rendering === "SPA") recommendations.push({ type: "warning", text: "SPA-сайт. Нейросети не видят контент без JS. Рекомендуем SSR или статические мета-теги." });
  if (whois?.days_until_expiry != null && whois.days_until_expiry < 30) recommendations.push({ type: "critical", text: `Домен истекает через ${whois.days_until_expiry} дней! Срочно продлите!` });
  else if (whois?.days_until_expiry != null && whois.days_until_expiry < 90) recommendations.push({ type: "warning", text: `Домен истекает через ${whois.days_until_expiry} дней. Продлите заранее.` });
  if (!tech.cdn) recommendations.push({ type: "info", text: "CDN не обнаружен. Cloudflare (бесплатно) ускорит загрузку." });
  if (geoip?.country_code && geoip.country_code !== "RU" && tech.analytics.includes("Яндекс.Метрика")) {
    recommendations.push({ type: "info", text: "Сервер за рубежом. Яндекс учитывает геолокацию при ранжировании." });
  }

  const knownAnalytics = ["Яндекс.Метрика", "Google Analytics 4", "Google Tag Manager"];

  return (
    <div className="space-y-3">
      <table className="w-full">
        <tbody>
          {/* Stack */}
          <Row label="CMS">
            {tech.cms ? (
              <span className="inline-flex items-center gap-1.5">
                <TechIcon name={tech.cms} /> {tech.cms}{tech.cms_version ? ` ${tech.cms_version}` : ""}
                <Badge variant="outline" className="text-[10px] ml-1">{tech.cms_confidence?.toUpperCase()}</Badge>
              </span>
            ) : "Не определена"}
          </Row>
          {tech.framework && <Row label="Фреймворк"><span className="inline-flex items-center gap-1.5"><TechIcon name={tech.framework} /> {tech.framework}</span></Row>}
          <Row label="Тип рендеринга">{tech.rendering}</Row>
          <Row label="Веб-сервер">
            {tech.server ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.server} /> {tech.server}{tech.server_version ? ` ${tech.server_version}` : ""}</span> : "—"}
          </Row>
          <Row label="CDN">
            {tech.cdn ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.cdn} /> {tech.cdn}</span> : "—"}
          </Row>

          <SectionDivider />

          {/* Domain */}
          <Row label="Регистратор">{whois?.registrar}</Row>
          <Row label="Дата регистрации">{formatDate(whois?.created_date ?? null)}</Row>
          <Row label="Истечение">
            {whois?.expiry_date ? (
              <span className="inline-flex items-center gap-2">
                {formatDate(whois.expiry_date)} {expiryBadge(whois.days_until_expiry)}
              </span>
            ) : "—"}
          </Row>

          <SectionDivider />

          {/* Hosting */}
          <Row label="Хостинг">{geoip?.hosting_provider}</Row>
          <Row label="IP / Страна">
            {geoip ? (
              <span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{geoip.ip_address}</code>
                {' '}{geoip.country_flag} {geoip.country}{geoip.city ? `, ${geoip.city}` : ""}
              </span>
            ) : "—"}
          </Row>

          <SectionDivider />

          {/* Analytics */}
          {knownAnalytics.map(name => {
            const found = tech.analytics.includes(name);
            const id = tech.analytics_ids[name === "Яндекс.Метрика" ? "Яндекс.Метрика" : name === "Google Analytics 4" ? "GA4" : "GTM"];
            return (
              <Row key={name} label={name}>
                <span className="inline-flex items-center gap-1.5">
                  <FoundBadge found={found} />
                  {found && id && <code className="text-[10px] bg-muted px-1 rounded">{id}</code>}
                </span>
              </Row>
            );
          })}
          {tech.analytics.filter(a => !knownAnalytics.includes(a)).map(a => (
            <Row key={a} label={a}><FoundBadge found={true} /></Row>
          ))}
          {tech.crm_widgets.map(w => (
            <Row key={w} label={w}><FoundBadge found={true} /></Row>
          ))}
        </tbody>
      </table>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((r, i) => (
            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
              r.type === "critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
              r.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
              "bg-primary/5 border-primary/10 text-muted-foreground"
            }`}>
              {r.type === "critical" || r.type === "warning"
                ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechPassport;
