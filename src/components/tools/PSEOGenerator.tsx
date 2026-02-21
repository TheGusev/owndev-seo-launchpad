import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles, ChevronRight } from "lucide-react";

const niches = ["Юридические услуги", "Медицина / клиники", "Ремонт квартир", "Автосервис", "Доставка еды", "Образование"];
const cities = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород"];

const PSEOGenerator = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      {/* Mini-steps */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === 1 ? "Ниша" : s === 2 ? "Город" : "Настройка"}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Выберите нишу</label>
            <Select onValueChange={() => setStep(Math.max(step, 2))}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите нишу…" />
              </SelectTrigger>
              <SelectContent>
                {niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Выберите город</label>
            <Select onValueChange={() => setStep(Math.max(step, 3))}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите город…" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Типы страниц (через запятую)</label>
          <Input placeholder="Услуга + Город, Район + Услуга, FAQ…" className="bg-card border-border" />
        </div>

        <div className="text-center pt-2">
          <GradientButton size="lg" className="group">
            <Sparkles className="w-5 h-5 mr-2" />
            Сгенерировать структуру
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default PSEOGenerator;
