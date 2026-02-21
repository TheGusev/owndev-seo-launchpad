import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { FileText, Search } from "lucide-react";

const SemanticCoreGenerator = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Базовый запрос</label>
            <Input placeholder="ремонт квартир" className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Регион</label>
            <Input placeholder="Москва" className="bg-card border-border" />
          </div>
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <FileText className="w-5 h-5 mr-2" />
            Собрать семантику
          </GradientButton>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {["Информационные", "Коммерческие", "Транзакционные"].map((cluster) => (
            <div key={cluster} className="glass rounded-xl p-4 text-center">
              <Search className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-foreground">{cluster}</p>
              <p className="text-xs text-muted-foreground mt-1">0 запросов</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
          Введите базовый запрос для сбора семантического ядра
        </div>
      </div>
    </div>
  );
};

export default SemanticCoreGenerator;
