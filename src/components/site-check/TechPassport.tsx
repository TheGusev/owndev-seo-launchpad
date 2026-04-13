import { Badge } from "@/components/ui/badge";

interface TechData {
  cms?: string;
  framework?: string;
  language?: string;
  server?: string;
  php_version?: string;
  wordpress_version?: string;
  analytics?: string[];
  [key: string]: unknown;
}

interface GeoIpData {
  country_code?: string;
  country_flag?: string;
  city?: string;
  hosting?: string;
}

interface TechPassportProps {
  data?: {
    tech?: TechData;
    geoip?: GeoIpData;
  };
}

const KNOWN_ANALYTICS = ["Яндекс.Метрика", "Google Analytics", "GA4", "Метрика 2.0"];

const META_KEYS: Record<string, string> = {
  php_version: "PHP",
  wordpress_version: "WordPress",
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">{children}</div>
);

export default function TechPassport({ data }: TechPassportProps) {
  if (!data) return null;
  const tech = data.tech;
  const geoip = data.geoip;
  const analytics = Array.isArray(tech?.analytics) ? tech.analytics : [];

  const techBadges = [
    tech?.cms && `CMS: ${tech.cms}`,
    tech?.framework && `Framework: ${tech.framework}`,
    tech?.language && `Язык: ${tech.language}`,
    tech?.server && `Сервер: ${tech.server}`,
  ].filter(Boolean) as string[];

  const geoBadges = [
    geoip?.country_flag && geoip?.country_code && `${geoip.country_flag} ${geoip.country_code}`,
    geoip?.city && `📍 ${geoip.city}`,
    geoip?.hosting && `🏢 ${geoip.hosting}`,
  ].filter(Boolean) as string[];

  const metaBadges = Object.entries(META_KEYS)
    .filter(([key]) => tech?.[key])
    .map(([key, label]) => `${label}: ${tech![key]}`);

  const hasYandexMetrika =
    geoip?.country_code &&
    geoip.country_code !== "RU" &&
    analytics.includes("Яндекс.Метрика");

  const hasTech = techBadges.length > 0;
  const hasGeo = geoBadges.length > 0;
  const hasAnalytics = analytics.length > 0;
  const hasMeta = metaBadges.length > 0;

  if (!hasTech && !hasGeo && !hasAnalytics && !hasMeta) return null;

  return (
    <div className="space-y-4">
      {hasTech && (
        <div>
          <SectionTitle>Технологии</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {techBadges.map(b => <Badge key={b} variant="outline">{b}</Badge>)}
          </div>
        </div>
      )}

      {hasGeo && (
        <div>
          <SectionTitle>Сервер / Геолокация</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {geoBadges.map(b => <Badge key={b} variant="outline">{b}</Badge>)}
          </div>
        </div>
      )}

      {hasAnalytics && (
        <div>
          <SectionTitle>Аналитика</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {KNOWN_ANALYTICS.map(name => {
              const found = analytics.includes(name);
              return (
                <Badge key={name} variant={found ? "default" : "outline"} className={found ? "bg-emerald-600/80" : ""}>
                  {name} {found ? "✓" : "—"}
                </Badge>
              );
            })}
            {analytics.filter(a => !KNOWN_ANALYTICS.includes(a)).map(a => (
              <Badge key={a} variant="outline">{a}</Badge>
            ))}
          </div>
          {hasYandexMetrika && (
            <p className="text-[11px] text-amber-500 mt-1.5">
              Для зарубежного трафика стоит отключить Яндекс.Метрику или добавить альтернативную аналитику.
            </p>
          )}
        </div>
      )}

      {hasMeta && (
        <div>
          <SectionTitle>Версии</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {metaBadges.map(b => <Badge key={b} variant="outline">{b}</Badge>)}
          </div>
        </div>
      )}
    </div>
  );
}
