import { Badge } from "@/components/ui/badge";

interface TechData {
  cms?: string;
  framework?: string;
  language?: string;
  analytics?: string[];
}

interface TechPassportProps {
  data?: {
    tech?: TechData;
    geoip?: { country_code?: string; country_flag?: string };
  };
}

const KNOWN_ANALYTICS = ["Яндекс.Метрика", "Google Analytics", "GA4", "Метрика 2.0"];

export default function TechPassport({ data }: TechPassportProps) {
  if (!data) return null;
  const tech = data.tech;
  const geoip = data.geoip;
  const analytics = Array.isArray(tech?.analytics) ? tech.analytics : [];

  const hasYandexMetrika =
    geoip?.country_code &&
    geoip.country_code !== "RU" &&
    analytics.includes("Яндекс.Метрика");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tech?.cms && <Badge variant="outline">CMS: {tech.cms}</Badge>}
        {tech?.framework && <Badge variant="outline">Framework: {tech.framework}</Badge>}
        {tech?.language && <Badge variant="outline">Язык: {tech.language}</Badge>}
      </div>

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
        {hasYandexMetrika && (
          <p className="text-[11px] text-amber-500">
            Для зарубежного трафика стоит отключить Яндекс.Метрику или добавить альтернативную аналитику.
          </p>
        )}
      </div>
    </div>
  );
}
