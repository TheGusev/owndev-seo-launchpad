import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Search, Globe, Zap, Smartphone } from "lucide-react";

const checks = [
  { icon: Globe, label: "Core Web Vitals", status: "—" },
  { icon: Zap, label: "Скорость загрузки", status: "—" },
  { icon: Smartphone, label: "Мобильная адаптивность", status: "—" },
  { icon: Search, label: "Meta-теги", status: "—" },
];

const SEOAuditor = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL сайта для аудита</label>
          <Input placeholder="https://example.com" className="bg-card border-border" />
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Search className="w-5 h-5 mr-2" />
            Запустить аудит
          </GradientButton>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {checks.map((c) => (
            <div key={c.label} className="glass rounded-xl p-4 flex items-center gap-3">
              <c.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-foreground flex-1">{c.label}</span>
              <span className="text-sm font-bold text-muted-foreground">{c.status}</span>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
          Введите URL и нажмите «Запустить аудит» для анализа
        </div>
      </div>
    </div>
  );
};

export default SEOAuditor;
