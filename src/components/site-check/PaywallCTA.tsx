import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaywallCTAProps {
  onSubmit: (email: string) => Promise<void>;
}

export function PaywallCTA({ onSubmit }: PaywallCTAProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const safeEmail = typeof email === "string" ? email.trim() : "";
    if (!safeEmail || !safeEmail.includes("@")) return;
    setLoading(true);
    try {
      await onSubmit(safeEmail);
    } finally {
      setLoading(false);
    }
  };

  const safeEmail = typeof email === "string" ? email : "";

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-card/60 p-3 text-xs">
      <p className="text-muted-foreground">
        Оставьте email, и мы откроем расширенный отчёт и уведомим о новых фичах.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleSubmit}
          disabled={!safeEmail.includes("@") || loading}
        >
          {loading ? "Отправляем..." : "Открыть отчёт"}
        </Button>
      </div>
    </div>
  );
}
