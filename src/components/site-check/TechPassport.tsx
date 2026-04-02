import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, Globe, BarChart3, MessageSquare, AlertTriangle, Info, Shield, Search } from "lucide-react";
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
  Shopify: "shopify", Joomla: "joomla", Drupal: "drupal",
  React: "react", "Vue.js": "vuedotjs", "Next.js": "nextdotjs",
  "Nuxt.js": "nuxtdotjs", Angular: "angular", Gatsby: "gatsby", Svelte: "svelte",
  Nginx: "nginx", Apache: "apache", Cloudflare: "cloudflare",
};

const TechIcon = ({ name }: { name: string | null }) => {
  if (!name) return <span className="text-lg">🔧</span>;
  const slug = ICON_MAP[name];
  if (!slug) return <span className="text-lg">🔧</span>;
  return <img src={`https://cdn.simpleicons.org/${slug}`} width={20} height={20} alt={name} className="inline-block" loading="lazy" />;
};

const InfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="text-muted-foreground shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value || "Нет данных"}</p>
    </div>
  </div>
);

const Card = ({ title, icon, children, delay = 0 }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/30 transition-colors"
  >
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="space-y-1">{children}</div>
  </motion.div>
);

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Нет данных";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function expiryColor(days: number | null) {
  if (days === null) return "text-muted-foreground";
  if (days < 30) return "text-destructive";
  if (days < 90) return "text-yellow-500";
  return "text-green-500";
}

const TechPassport = ({ data }: TechPassportProps) => {
  const { tech, whois, geoip } = data;

  // Smart recommendations
  const recommendations: { type: "warning" | "critical" | "info"; text: string }[] = [];
  if (tech.rendering === "SPA") recommendations.push({ type: "warning", text: "Ваш сайт — SPA. Нейросети не видят контент без JavaScript. Рекомендуем Server-Side Rendering или статический HTML для мета-тегов." });
  if (whois?.days_until_expiry !== null && whois?.days_until_expiry !== undefined) {
    if (whois.days_until_expiry < 30) recommendations.push({ type: "critical", text: `Домен истекает через ${whois.days_until_expiry} дней! Срочно продлите!` });
    else if (whois.days_until_expiry < 90) recommendations.push({ type: "warning", text: `Домен истекает через ${whois.days_until_expiry} дней. Рекомендуем продлить заранее.` });
  }
  if (tech.cms === "WordPress" && tech.cms_version) recommendations.push({ type: "info", text: `WordPress ${tech.cms_version}. Обновляйте регулярно — устаревшие версии уязвимы.` });
  if (geoip?.country_code && geoip.country_code !== "RU" && tech.analytics.includes("Яндекс.Метрика")) {
    recommendations.push({ type: "info", text: "Сервер за рубежом. Для российской аудитории рекомендуется хостинг в РФ — Яндекс учитывает геолокацию." });
  }
  if (!tech.cdn) recommendations.push({ type: "info", text: "CDN не обнаружен. Подключите Cloudflare (бесплатно) для ускорения и защиты." });

  const knownAnalytics = ["Яндекс.Метрика", "Google Analytics 4", "Google Tag Manager"];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">Технический паспорт сайта</h2>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {tech.cms && <Badge variant="secondary" className="gap-1.5"><TechIcon name={tech.cms} /> {tech.cms}</Badge>}
        {tech.framework && <Badge variant="secondary" className="gap-1.5"><TechIcon name={tech.framework} /> {tech.framework}</Badge>}
        {tech.server && <Badge variant="secondary" className="gap-1.5"><TechIcon name={tech.server} /> {tech.server}</Badge>}
        {tech.cdn && <Badge variant="secondary" className="gap-1.5"><TechIcon name={tech.cdn} /> {tech.cdn}</Badge>}
        {geoip && <Badge variant="secondary">{geoip.country_flag} {geoip.country}</Badge>}
        {whois?.days_until_expiry !== null && whois?.days_until_expiry !== undefined && (
          <Badge variant="outline" className={expiryColor(whois.days_until_expiry)}>
            Домен: {whois.days_until_expiry} дн.
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Stack */}
        <Card title="Стек и платформа" icon={<Server className="w-4 h-4 text-primary" />} delay={0}>
          <InfoRow label="CMS / Конструктор" value={
            tech.cms ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.cms} /> {tech.cms}{tech.cms_version ? ` ${tech.cms_version}` : ""} <Badge variant="outline" className="text-[10px] ml-1">{tech.cms_confidence?.toUpperCase()}</Badge></span> : "Не определена"
          } icon={<span className="text-sm">🏗️</span>} />
          <InfoRow label="Фреймворк" value={
            tech.framework ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.framework} /> {tech.framework} ({tech.rendering})</span> : tech.rendering
          } icon={<span className="text-sm">⚛️</span>} />
          <InfoRow label="Веб-сервер" value={
            tech.server ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.server} /> {tech.server}{tech.server_version ? ` ${tech.server_version}` : ""}</span> : null
          } icon={<span className="text-sm">🖥️</span>} />
          <InfoRow label="CDN / Защита" value={
            tech.cdn ? <span className="inline-flex items-center gap-1.5"><TechIcon name={tech.cdn} /> {tech.cdn}</span> : "Не обнаружен"
          } icon={<span className="text-sm">☁️</span>} />
        </Card>

        {/* Card 2: Domain */}
        <Card title="Домен" icon={<Globe className="w-4 h-4 text-primary" />} delay={0.1}>
          <InfoRow label="Регистратор" value={whois?.registrar} icon={<span className="text-sm">🌐</span>} />
          <InfoRow label="Дата регистрации" value={formatDate(whois?.created_date ?? null)} icon={<span className="text-sm">📅</span>} />
          <InfoRow label="Истечение домена" value={
            whois?.expiry_date ? (
              <span className={expiryColor(whois.days_until_expiry)}>
                {formatDate(whois.expiry_date)}
                {whois.days_until_expiry !== null && ` (${whois.days_until_expiry} дн.)`}
              </span>
            ) : null
          } icon={<span className="text-sm">⏳</span>} />
        </Card>

        {/* Card 3: Hosting */}
        <Card title="Сервер и хостинг" icon={<Shield className="w-4 h-4 text-primary" />} delay={0.2}>
          <InfoRow label="Страна сервера" value={geoip ? `${geoip.country_flag} ${geoip.country}${geoip.city ? `, ${geoip.city}` : ""}` : null} icon={<span className="text-sm">📍</span>} />
          <InfoRow label="Хостинг-провайдер" value={geoip?.hosting_provider} icon={<span className="text-sm">🏢</span>} />
          <InfoRow label="IP-адрес" value={geoip?.ip_address ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{geoip.ip_address}</code> : null} icon={<span className="text-sm">📡</span>} />
        </Card>

        {/* Card 4: Analytics */}
        <Card title="Аналитика и виджеты" icon={<BarChart3 className="w-4 h-4 text-primary" />} delay={0.3}>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Аналитика</p>
            {knownAnalytics.map(name => {
              const found = tech.analytics.includes(name);
              const id = tech.analytics_ids[name === "Яндекс.Метрика" ? "Яндекс.Метрика" : name === "Google Analytics 4" ? "GA4" : "GTM"];
              return (
                <div key={name} className={`text-sm flex items-center gap-1.5 ${found ? "text-green-500" : "text-muted-foreground/60"}`}>
                  {found ? "✅" : "❌"} {name} {id && <code className="text-[10px] bg-muted px-1 rounded">{id}</code>}
                </div>
              );
            })}
            {tech.analytics.filter(a => !knownAnalytics.includes(a)).map(a => (
              <div key={a} className="text-sm text-green-500 flex items-center gap-1.5">✅ {a}</div>
            ))}
          </div>
          {tech.crm_widgets.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Виджеты и CRM</p>
              {tech.crm_widgets.map(w => (
                <div key={w} className="text-sm text-green-500 flex items-center gap-1.5">✅ {w}</div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 mt-2">
          {recommendations.map((r, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
              r.type === "critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
              r.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400" :
              "bg-primary/5 border-primary/10 text-muted-foreground"
            }`}>
              {r.type === "critical" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
               r.type === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
               <Info className="w-4 h-4 shrink-0 mt-0.5" />}
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TechPassport;
