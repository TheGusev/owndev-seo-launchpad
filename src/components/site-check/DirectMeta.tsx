import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DirectMetaProps {
  data: {
    ad_headline?: string;
    autotargeting_categories?: string[];
    [key: string]: any;
  };
}

const DirectMeta = ({ data }: DirectMetaProps) => {
  if (!data) return null;
  const { ad_headline, autotargeting_categories } = data;
  if (!ad_headline && (!autotargeting_categories || autotargeting_categories.length === 0)) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        Рекомендации для Яндекс.Директ
      </h2>

      <div className="border rounded-xl p-5 bg-card/50 backdrop-blur space-y-4">
        {ad_headline && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Готовый заголовок объявления</p>
            <p className="text-base font-semibold text-foreground border border-dashed border-primary/30 rounded-lg px-4 py-2 bg-primary/5">
              {ad_headline}
            </p>
          </div>
        )}

        {autotargeting_categories && autotargeting_categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Рекомендуемые категории автотаргетинга</p>
            <div className="flex flex-wrap gap-2">
              {autotargeting_categories.map((cat, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMeta;
