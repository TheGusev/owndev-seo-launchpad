import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Users, Trophy } from "lucide-react";

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

        <div className="text-center">
          <GradientButton size="lg">
            <Users className="w-5 h-5 mr-2" />
            Анализировать ТОП-10
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          Введите запрос для анализа конкурентов в выдаче
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
