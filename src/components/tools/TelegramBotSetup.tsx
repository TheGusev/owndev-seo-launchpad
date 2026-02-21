import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send } from "lucide-react";

const notifications = [
  { id: "errors", label: "Ошибки 404 и 500" },
  { id: "positions", label: "Изменения позиций" },
  { id: "competitors", label: "Действия конкурентов" },
  { id: "indexation", label: "Проблемы индексации" },
];

const TelegramBotSetup = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Токен Telegram-бота</label>
          <Input placeholder="123456789:ABCDefGhIJKlmnOPQRstUVwxyz" className="bg-card border-border" />
          <p className="text-xs text-muted-foreground">Получите токен у @BotFather в Telegram</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Chat ID</label>
          <Input placeholder="-1001234567890" className="bg-card border-border" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Уведомления:</p>
          {notifications.map((n) => (
            <label key={n.id} className="flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer">
              <Checkbox />
              <span className="text-sm text-foreground">{n.label}</span>
            </label>
          ))}
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <Send className="w-5 h-5 mr-2" />
            Подключить бота
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Настройте бота для получения уведомлений в Telegram</p>
        </div>
      </div>
    </div>
  );
};

export default TelegramBotSetup;
