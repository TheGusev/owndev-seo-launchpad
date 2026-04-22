import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DirectMetaProps {
  data: {
    autotargeting_categories?: string[] | Record<string, boolean>;
    [key: string]: any;
  };
}

const DirectMeta = ({ data }: DirectMetaProps) => {
  if (!data) return null;
  const { autotargeting_categories } = data;

  // Normalize: backend sends Record<string, boolean>, frontend may receive array
  let categories: string[] = [];
  if (Array.isArray(autotargeting_categories)) {
    categories = autotargeting_categories;
  } else if (autotargeting_categories && typeof autotargeting_categories === 'object') {
    categories = Object.entries(autotargeting_categories)
      .filter(([, enabled]) => enabled)
      .map(([k]) => k);
  }

  if (categories.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary" />
        Категории автотаргетинга Яндекс.Директ
      </h2>

      <div className="border rounded-xl p-4 bg-card/50 backdrop-blur">
        <p className="text-xs text-muted-foreground mb-2">Рекомендуемые категории на основе анализа страницы</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DirectMeta;
