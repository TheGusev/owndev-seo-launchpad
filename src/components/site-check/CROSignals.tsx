import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import type { CROData } from "@/lib/site-check-types";

interface Props {
  cro: CROData | null;
}

/**
 * Sprint 5 — CRO-сигналы: trust, CTA, формы, channels.
 */
export default function CROSignals({ cro }: Props) {
  if (!cro) return null;

  const trust = cro.trust;
  const channels = cro.channels;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Доверие и контакты
        <span className="ml-auto text-foreground font-medium">
          Trust: {cro.trustScore}/100
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <TrustBadge ok={trust.hasPhone} icon={<Phone className="w-3 h-3" />} label="Телефон" />
        <TrustBadge ok={trust.hasEmail} icon={<Mail className="w-3 h-3" />} label="Email" />
        <TrustBadge ok={trust.hasAddress} icon={<MapPin className="w-3 h-3" />} label="Адрес" />
        <TrustBadge ok={trust.hasLegalInfo} label="Реквизиты" />
        <TrustBadge ok={trust.hasGuarantee} label="Гарантия" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <Mini label="CTA на странице" value={String(cro.cta.count)} ok={cro.cta.count > 0} />
        <Mini label="CTA на 1-м экране" value={cro.cta.hasAboveFold ? "Да" : "Нет"} ok={cro.cta.hasAboveFold} />
        <Mini label="Формы" value={String(cro.forms.count)} ok={cro.forms.count > 0} />
        <Mini
          label="Полей в форме"
          value={cro.forms.avgFields ? cro.forms.avgFields.toFixed(1) : "—"}
          ok={cro.forms.avgFields > 0 && cro.forms.avgFields <= 5}
        />
      </div>

      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-1">
        <MessageCircle className="w-3.5 h-3.5" /> Каналы коммуникации
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TrustBadge ok={channels.hasMessenger} label="Мессенджер" />
        <TrustBadge ok={channels.hasChat} label="Онлайн-чат" />
        <TrustBadge ok={channels.hasCallback} label="Обратный звонок" />
        <TrustBadge ok={cro.socialProof.hasReviews} label="Отзывы" />
        <TrustBadge ok={cro.socialProof.hasLogos} label="Логотипы клиентов" />
      </div>
    </div>
  );
}

function TrustBadge({ ok, label, icon }: { ok: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <Badge
      variant={ok ? "default" : "outline"}
      className={ok ? "bg-emerald-600/70 gap-1" : "opacity-50 gap-1"}
    >
      {icon}
      {label} {ok ? "✓" : "—"}
    </Badge>
  );
}

function Mini({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  const cls = ok ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive";
  return (
    <div className={`rounded-md border ${cls} bg-card/30 px-2 py-1.5 text-center`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}