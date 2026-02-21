import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Bell, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const mockAlerts = [
  { type: "warning", text: "Конкурент добавил 15 новых страниц", time: "2ч назад" },
  { type: "error", text: "Обнаружена ошибка 404 на /services/moscow", time: "5ч назад" },
  { type: "success", text: "Все страницы проиндексированы", time: "1д назад" },
];

const ChangeAlerts = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Домен для мониторинга</label>
          <Input placeholder="example.com" className="bg-card border-border" />
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Bell className="w-5 h-5 mr-2" />
            Настроить мониторинг
          </GradientButton>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">Последние алерты</p>
          {mockAlerts.map((a, i) => (
            <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              {a.type === "warning" && <AlertTriangle className="w-5 h-5 text-warning shrink-0" />}
              {a.type === "error" && <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
              {a.type === "success" && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
              <span className="text-sm text-foreground flex-1">{a.text}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{a.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangeAlerts;
