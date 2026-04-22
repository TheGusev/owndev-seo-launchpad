import { Badge } from "@/components/ui/badge";

interface TechData {
  cms?: string;
  framework?: string;
  language?: string;
  server?: string;
  ssl?: string;
  php_version?: string;
  wordpress_version?: string;
  analytics?: string[];
  [key: string]: unknown;
}

interface GeoIpData {
  ip?: string;
  country_code?: string;
  country_flag?: string;
  country_name?: string;
  city?: string;
  region?: string;
  org?: string;
  asn?: string;
  hosting?: string;
  hosting_name?: string;
}

interface FilesData {
  robots_txt?: boolean;
  llms_txt?: boolean;
  sitemap_xml?: boolean;
  security_txt?: boolean;
}

interface SecurityData {
  has_hsts?: boolean;
  has_x_frame?: boolean;
  has_xcto?: boolean;
  has_csp?: boolean;
  score?: number;
  ssl?: string;
}

interface TechPassportProps {
  data?: {
    tech?: TechData;
    geoip?: GeoIpData;
    files?: FilesData;
    security?: SecurityData;
    accessible?: boolean;
  };
}

const KNOWN_ANALYTICS = [
  "Яндекс.Метрика",
  "Google Analytics",
  "Facebook Pixel",
  "VK Pixel",
  "Mail.ru Counter",
  "CallTouch",
  "Roistat",
];

const META_KEYS: Record<string, string> = {
  php_version: "PHP",
  wordpress_version: "WordPress",
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
    {children}
  </div>
);

export default function TechPassport({ data }: TechPassportProps) {
  if (!data) return null;
  const tech = data.tech;
  const geoip = data.geoip;
  const files = data.files;
  const security = data.security;
  const analytics = Array.isArray(tech?.analytics) ? tech.analytics : [];

  // Tech section
  const techBadges: string[] = [
    tech?.cms ? `CMS: ${tech.cms}` : null,
    tech?.framework ? `Framework: ${tech.framework}` : null,
    tech?.language ? `Язык: ${tech.language}` : null,
    tech?.server ? `Сервер: ${tech.server}` : null,
    tech?.ssl ? `SSL: ${tech.ssl}` : null,
  ].filter(Boolean) as string[];

  // Geo / Server section — IP, хостинг, страна, город
  const geoBadges: string[] = [];
  if (geoip?.ip) geoBadges.push(`IP: ${geoip.ip}`);
  if (geoip?.country_flag && geoip?.country_code) {
    const loc = [geoip.country_flag, geoip.country_name || geoip.country_code, geoip.city].filter(Boolean).join(' · ');
    geoBadges.push(loc);
  }
  if (geoip?.hosting || geoip?.hosting_name) {
    geoBadges.push(`🏢 ${geoip.hosting_name || geoip.hosting}`);
  }
  if (geoip?.asn) geoBadges.push(`ASN: ${geoip.asn}`);

  // Files section
  const filesBadges: { label: string; ok: boolean }[] = files
    ? [
        { label: "robots.txt", ok: !!files.robots_txt },
        { label: "sitemap.xml", ok: !!files.sitemap_xml },
        { label: "llms.txt", ok: !!files.llms_txt },
        { label: "security.txt", ok: !!files.security_txt },
      ]
    : [];

  // Security section
  const secBadges: { label: string; ok: boolean }[] = security
    ? [
        { label: "HSTS", ok: !!security.has_hsts },
        { label: "X-Frame", ok: !!security.has_x_frame },
        { label: "X-Content-Type", ok: !!security.has_xcto },
        { label: "CSP", ok: !!security.has_csp },
      ]
    : [];

  const metaBadges = Object.entries(META_KEYS)
    .filter(([key]) => tech?.[key])
    .map(([key, label]) => `${label}: ${tech![key]}`);

  const hasYandexMetrika =
    !!geoip?.country_code &&
    geoip.country_code !== "RU" &&
    analytics.includes("Яндекс.Метрика");

  const hasTech = techBadges.length > 0;
  const hasGeo = geoBadges.length > 0;
  const hasAnalytics = analytics.length > 0;
  const hasMeta = metaBadges.length > 0;
  const hasFiles = filesBadges.length > 0;
  const hasSec = secBadges.length > 0;

  if (!hasTech && !hasGeo && !hasAnalytics && !hasMeta && !hasFiles && !hasSec) {
    return (
      <p className="text-xs text-muted-foreground">
        Не удалось определить технический стек. Сайт может быть недоступен.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {hasTech && (
        <div>
          <SectionTitle>Технологии</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {techBadges.map((b) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
            {metaBadges.map((b) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasGeo && (
        <div>
          <SectionTitle>Сервер / Геолокация</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {geoBadges.map((b) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasFiles && (
        <div>
          <SectionTitle>Технические файлы</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {filesBadges.map(({ label, ok }) => (
              <Badge
                key={label}
                variant={ok ? "default" : "outline"}
                className={ok ? "bg-emerald-600/80" : "opacity-50"}
              >
                {label} {ok ? "✓" : "—"}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasSec && (
        <div>
          <SectionTitle>
            Безопасность
            {security?.score !== undefined && (
              <span className="ml-2 text-foreground font-medium">{security.score}/100</span>
            )}
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {secBadges.map(({ label, ok }) => (
              <Badge
                key={label}
                variant={ok ? "default" : "outline"}
                className={ok ? "bg-primary/80" : "opacity-50"}
              >
                {label} {ok ? "✓" : "—"}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasAnalytics && (
        <div>
          <SectionTitle>Аналитика</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {KNOWN_ANALYTICS.map((name) => {
              const found = analytics.includes(name);
              return (
                <Badge
                  key={name}
                  variant={found ? "default" : "outline"}
                  className={found ? "bg-emerald-600/80" : "opacity-40"}
                >
                  {name} {found ? "✓" : "—"}
                </Badge>
              );
            })}
            {analytics
              .filter((a) => !KNOWN_ANALYTICS.includes(a))
              .map((a) => (
                <Badge key={a} variant="outline">
                  {a}
                </Badge>
              ))}
          </div>
          {hasYandexMetrika && (
            <p className="text-[11px] text-amber-500 mt-1.5">
              Для зарубежного трафика стоит отключить Яндекс.Метрику или добавить
              альтернативную аналитику.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
