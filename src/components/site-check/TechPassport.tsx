import { Badge } from "@/components/ui/badge";

// FIX: расширен интерфейс geoip — бэкенд отдаёт city/org/region, country_flag отсутствует
interface TechData {
  cms?: string;
  framework?: string;
  language?: string;
  server?: string;
  analytics?: string[];
}

interface SecurityData {
  https?: boolean;
  csp?: boolean;
  hsts?: boolean;
}

interface GeoipData {
  country_code?: string;
  country_flag?: string; // legacy — может отсутствовать
  city?: string;
  org?: string;
  region?: string;
  timezone?: string;
}

interface TechPassportProps {
  data?: {
    tech?: TechData;
    security?: SecurityData;
    geoip?: GeoipData;
    _error?: string;
  };
}

// FIX: FLAG_MAP — бэкенд не отдаёт country_flag, генерируем на фронте
const FLAG_MAP: Record<string, string> = {
  RU: '🇷🇺', US: '🇺🇸', DE: '🇩🇪', NL: '🇳🇱', FI: '🇫🇮',
  GB: '🇬🇧', FR: '🇫🇷', UA: '🇺🇦', KZ: '🇰🇿', BY: '🇧🇾',
  PL: '🇵🇱', CZ: '🇨🇿', SE: '🇸🇪', LT: '🇱🇹', LV: '🇱🇻',
  EE: '🇪🇪', AT: '🇦🇹', CH: '🇨🇭', IT: '🇮🇹', ES: '🇪🇸',
};

const KNOWN_ANALYTICS = ["Яндекс.Метрика", "Google Analytics", "GA4", "Метрика 2.0"];

export default function TechPassport({ data }: TechPassportProps) {
  // FIX: показываем error state вместо return null
  if (!data) return null;

  if (data._error) {
    return (
      <div className="text-xs text-muted-foreground p-2">
        Технический паспорт недоступен: {data._error}
      </div>
    );
  }

  const tech = data.tech;
  const security = data.security;
  const geoip = data.geoip;
  const analytics = Array.isArray(tech?.analytics) ? tech.analytics : [];

  // FIX: генерируем флаг из FLAG_MAP если country_flag отсутствует в ответе бэкенда
  const countryCode = geoip?.country_code ?? '';
  const countryFlag = geoip?.country_flag ?? FLAG_MAP[countryCode] ?? '';

  const hasYandexMetrika =
    geoip?.country_code &&
    geoip.country_code !== "RU" &&
    analytics.includes("Яндекс.Метрика");

  return (
    <div className="space-y-3">
      {/* Технический стек */}
      <div className="flex flex-wrap gap-2">
        {tech?.server && <Badge variant="outline">Сервер: {tech.server}</Badge>}
        {tech?.cms && <Badge variant="outline">CMS: {tech.cms}</Badge>}
        {tech?.framework && <Badge variant="outline">Framework: {tech.framework}</Badge>}
        {tech?.language && <Badge variant="outline">Язык: {tech.language}</Badge>}
      </div>

      {/* GEO: страна, город, провайдер */}
      {geoip && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">GEO</div>
          <div className="flex flex-wrap gap-2">
            {countryCode && (
              <Badge variant="outline">
                {countryFlag} {countryCode}
                {geoip.city ? ` / ${geoip.city}` : ''}
                {geoip.region ? ` / ${geoip.region}` : ''}
              </Badge>
            )}
            {geoip.org && <Badge variant="outline">{geoip.org}</Badge>}
            {geoip.timezone && <Badge variant="outline">{geoip.timezone}</Badge>}
          </div>
        </div>
      )}

      {/* Безопасность: HTTPS / HSTS / CSP */}
      {security && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Безопасность</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={security.https ? 'default' : 'destructive'} className={security.https ? 'bg-emerald-600/80' : ''}>
              HTTPS {security.https ? '✓' : '✗'}
            </Badge>
            <Badge variant={security.hsts ? 'default' : 'outline'} className={security.hsts ? 'bg-emerald-600/80' : ''}>
              HSTS {security.hsts ? '✓' : '—'}
            </Badge>
            <Badge variant={security.csp ? 'default' : 'outline'} className={security.csp ? 'bg-emerald-600/80' : ''}>
              CSP {security.csp ? '✓' : '—'}
            </Badge>
          </div>
        </div>
      )}

      {/* Аналитика */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Аналитика</div>
        <div className="flex flex-wrap gap-2">
          {KNOWN_ANALYTICS.map(name => {
            const found = analytics.includes(name);
            return (
              <Badge
                key={name}
                variant={found ? "default" : "outline"}
                className={found ? "bg-emerald-600/80" : ""}
              >
                {name} {found ? "✓" : "—"}
              </Badge>
            );
          })}
          {analytics
            .filter(a => !KNOWN_ANALYTICS.includes(a))
            .map(a => (
              <Badge key={a} variant="outline">
                {a}
              </Badge>
            ))}
        </div>
      </div>

      {hasYandexMetrika && (
        <div className="text-xs text-amber-500 bg-amber-500/10 rounded p-2">
          Для зарубежного трафика стоит отключить Яндекс.Метрику или добавить альтернативную аналитику.
        </div>
      )}
    </div>
  );
}
