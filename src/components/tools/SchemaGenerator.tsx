import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Copy } from "lucide-react";

const schemaTypes = ["LocalBusiness", "FAQPage", "Organization", "Service", "BreadcrumbList"];

const SchemaGenerator = () => {
  const [type, setType] = useState("");

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Тип разметки</label>
            <Select onValueChange={setType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите тип…" />
              </SelectTrigger>
              <SelectContent>
                {schemaTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Название компании</label>
            <Input placeholder="ООО «Рога и Копыта»" className="bg-card border-border" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Адрес</label>
            <Input placeholder="Москва, ул. Примерная, 1" className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Телефон</label>
            <Input placeholder="+7 (495) 123-45-67" className="bg-card border-border" />
          </div>
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Code2 className="w-5 h-5 mr-2" />
            Сгенерировать JSON-LD
          </GradientButton>
        </div>

        {type && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Результат</p>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Copy className="w-3 h-3" /> Копировать
              </button>
            </div>
            <pre className="text-xs text-muted-foreground overflow-x-auto">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${type}",
  "name": "...",
  "address": "..."
}
</script>`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaGenerator;
