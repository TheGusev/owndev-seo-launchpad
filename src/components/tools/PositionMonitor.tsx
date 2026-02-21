import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

const mockData = [
  { query: "seo продвижение москва", pos: 12, change: -3 },
  { query: "programmatic seo", pos: 5, change: 2 },
  { query: "генератор страниц", pos: 8, change: 0 },
];

const PositionMonitor = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Домен</label>
            <Input placeholder="example.com" className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Регион проверки</label>
            <Input placeholder="Москва" className="bg-card border-border" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Запросы (по одному на строку)</label>
          <Textarea placeholder={"seo продвижение\nprogrammatic seo\nгенератор страниц"} className="bg-card border-border min-h-[100px]" />
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <BarChart3 className="w-5 h-5 mr-2" />
            Проверить позиции
          </GradientButton>
        </div>

        <div className="space-y-2">
          {mockData.map((d) => (
            <div key={d.query} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-sm text-foreground flex-1">{d.query}</span>
              <span className="text-sm font-bold text-foreground w-8 text-center">{d.pos}</span>
              {d.change > 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : d.change < 0 ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PositionMonitor;
