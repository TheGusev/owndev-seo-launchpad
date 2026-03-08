import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IndexationChecker = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Список URL (по одному на строку)</label>
          <Textarea
            placeholder={"https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"}
            className="bg-card border-border min-h-[180px]"
          />
          <p className="text-xs text-muted-foreground">Максимум 100 URL за один запрос</p>
        </div>

        <div className="text-center space-y-2">
          <GradientButton size="lg" disabled>
            <ListChecks className="w-5 h-5 mr-2" />
            Проверить индексацию
          </GradientButton>
          <Badge variant="secondary" className="ml-2">Скоро</Badge>
        </div>

        <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
          Инструмент в разработке — скоро здесь появится проверка индексации
        </div>
      </div>
    </div>
  );
};

export default IndexationChecker;
