import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CompetitorAnalysis = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Поисковый запрос</label>
          <Input placeholder="seo продвижение москва" className="bg-card border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Регион поиска</label>
          <Input placeholder="Москва" className="bg-card border-border" />
        </div>

        <div className="text-center space-y-2">
          <GradientButton size="lg" disabled>
            <Users className="w-5 h-5 mr-2" />
            Анализировать ТОП-10
          </GradientButton>
          <Badge variant="secondary" className="ml-2">Скоро</Badge>
        </div>

        <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          Инструмент в разработке — скоро здесь появится анализ конкурентов
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
