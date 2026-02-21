import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Wand2 } from "lucide-react";

const textTypes = ["Вступление для GEO-страницы", "FAQ под регион", "Описание услуги", "Мета-описание"];

const AITextGenerator = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Тип текста</label>
            <Select>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите тип…" />
              </SelectTrigger>
              <SelectContent>
                {textTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Город / регион</label>
            <Input placeholder="Новосибирск" className="bg-card border-border" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ниша / тематика</label>
          <Input placeholder="Дезинсекция, клининг, ремонт…" className="bg-card border-border" />
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Wand2 className="w-5 h-5 mr-2" />
            Сгенерировать текст
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Результат</p>
          </div>
          <Textarea
            readOnly
            placeholder="Здесь появится сгенерированный текст…"
            className="bg-card border-border min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
};

export default AITextGenerator;
