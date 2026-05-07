import { useEffect, useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { GradientButton } from '@/components/ui/gradient-button';
import { toast } from '@/hooks/use-toast';
import { sendTelegram } from '@/lib/api';
import { useLeadCapture, closeLead } from '@/lib/leadCapture';

type Status = 'idle' | 'sending' | 'sent';

const LeadModal = () => {
  const ctx = useLeadCapture();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<{ name?: string; contact?: string; consent?: string }>({});

  // Подставляем prefillMessage при открытии
  useEffect(() => {
    if (ctx) {
      setMessage(ctx.prefillMessage || '');
      setStatus('idle');
      setErrors({});
    }
  }, [ctx]);

  const isOpen = ctx !== null;

  const handleClose = (next: boolean) => {
    if (!next) {
      closeLead();
      // Сброс через таймаут чтобы не моргало при закрытии
      setTimeout(() => {
        if (status === 'sent') {
          setName('');
          setContact('');
          setMessage('');
          setConsent(false);
          setStatus('idle');
        }
      }, 300);
    }
  };

  const detectChannel = (raw: string): { phone?: string; email?: string; contact: string } => {
    const v = raw.trim();
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return { email: v, contact: v };
    if (/^[+\d][\d\s()\-]{6,}$/.test(v)) return { phone: v, contact: v };
    return { contact: v };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctx) return;

    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Введите имя';
    if (contact.trim().length < 4) next.contact = 'Укажите телефон, email или Telegram';
    if (!consent) next.consent = 'Необходимо согласие';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('sending');
    const channel = detectChannel(contact);
    try {
      await sendTelegram({
        name: name.trim(),
        ...channel,
        service: ctx.source,
        source: ctx.source,
        subject: ctx.subject,
        message: message.trim() || undefined,
        context_data: ctx.contextData || {},
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      setStatus('sent');
      toast({
        title: 'Заявка отправлена',
        description: 'Ответим в течение 15 минут в указанный канал.',
      });
    } catch (err) {
      console.error('LeadModal send error', err);
      setStatus('idle');
      toast({
        title: 'Не удалось отправить',
        description: 'Напишите нам в Telegram @one_help.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {ctx?.title || ctx?.subject || 'Связаться с нами'}
          </DialogTitle>
          {ctx?.description && (
            <DialogDescription className="text-muted-foreground">
              {ctx.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {status === 'sent' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <h3 className="text-xl font-bold">Заявка отправлена</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Мы получили все детали запроса и свяжемся с вами в течение 15 минут.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Контекст-метка: что именно человек хочет */}
            {ctx && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Запрос: </span>
                <span className="text-foreground font-medium">{ctx.source}</span>
                {ctx.contextData && Object.keys(ctx.contextData).length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                    {Object.entries(ctx.contextData)
                      .filter(([, v]) => v !== undefined && v !== null && v !== '')
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <li key={k}>
                          • <span className="text-foreground/80">{k}:</span> {String(v)}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Ваше имя *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван"
                className="bg-card"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Телефон, email или Telegram *</label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+7 (999) 123-45-67 / @username / mail@domain.ru"
                className="bg-card"
              />
              {errors.contact && <p className="text-xs text-destructive mt-1">{errors.contact}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Комментарий (опционально)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Что важно учесть, сроки, бюджет..."
                className="bg-card min-h-[80px]"
              />
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="lead-consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="lead-consent" className="text-xs text-muted-foreground cursor-pointer leading-snug">
                Согласен с{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  политикой конфиденциальности
                </a>
              </label>
            </div>
            {errors.consent && <p className="text-xs text-destructive -mt-2">{errors.consent}</p>}

            <GradientButton type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправляем
                </>
              ) : (
                <>
                  {ctx?.ctaLabel || 'Отправить заявку'}
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </GradientButton>

            <p className="text-xs text-muted-foreground text-center">
              Ответим в течение 15 минут в указанный канал.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;
