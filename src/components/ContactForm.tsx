import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { sendTelegram } from "@/lib/api";
import { useInView } from "react-intersection-observer";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, CheckCircle, Mail, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const detectChannel = (raw: string): { phone?: string; email?: string; contact: string } => {
  const v = raw.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return { email: v, contact: v };
  if (/^[+\d][\d\s()\-]{6,}$/.test(v)) return { phone: v, contact: v };
  return { contact: v };
};

const ContactForm = () => {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Контекст из query-параметров (когда переходим со страницы инструмента)
  const source = searchParams.get("source") || undefined;
  const subject = searchParams.get("subject") || undefined;
  const prefillMsg = searchParams.get("message") || "";

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState(prefillMsg);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string; consent?: string }>({});

  useEffect(() => { setMessage(prefillMsg); }, [prefillMsg]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Введите имя";
    if (contact.trim().length < 4) next.contact = "Укажите телефон, email или Telegram";
    if (!consent) next.consent = "Необходимо согласие";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const channel = detectChannel(contact);
    try {
      await sendTelegram({
        name: name.trim(),
        ...channel,
        source: source || "Страница «Контакты»",
        subject: subject || "Заявка с формы контактов",
        service: source,
        message: message.trim() || undefined,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      setIsSuccess(true);
      toast({ title: "Заявка отправлена", description: "Мы свяжемся с вами в течение 15 минут." });
      setTimeout(() => {
        setIsSuccess(false);
        setName("");
        setContact("");
        setMessage("");
        setConsent(false);
      }, 4000);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку. Напишите в Telegram @one_help.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "owndev@mail.ru", href: "mailto:owndev@mail.ru" },
    { icon: MessageCircle, label: "Telegram", value: "@one_help", href: "https://t.me/one_help?text=owndev" },
  ];

  return (
    <section id="contact" className="py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174_72%_56%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(217_91%_60%/0.08),transparent_50%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Свяжитесь с нами
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Опишите задачу — ответим в Telegram или по телефону в течение 15 минут.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-2xl p-8"
          >
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}>
                  <CheckCircle className="w-20 h-20 text-success mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Заявка отправлена</h3>
                <p className="text-muted-foreground text-center">
                  Мы свяжемся с вами в течение 15 минут.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                {(source || subject) && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Запрос: </span>
                    <span className="text-foreground font-medium">{subject || source}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">Ваше имя *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван"
                    className="bg-card border-border"
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Телефон, email или Telegram *</label>
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+7 (999) 123-45-67 / @username / mail@domain.ru"
                    className="bg-card border-border"
                  />
                  {errors.contact && <p className="text-xs text-destructive mt-1">{errors.contact}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Сообщение (опционально)</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Расскажите о вашем проекте, целях, сроках..."
                    className="bg-card border-border min-h-[100px]"
                  />
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="contact-consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="contact-consent" className="text-xs text-muted-foreground cursor-pointer leading-snug">
                    Согласен с{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      политикой конфиденциальности
                    </a>{" "}
                    и{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      пользовательским соглашением
                    </a>
                  </label>
                </div>
                {errors.consent && <p className="text-xs text-destructive -mt-3">{errors.consent}</p>}

                <GradientButton type="submit" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Отправляем
                    </>
                  ) : (
                    <>
                      Отправить заявку
                      <Send className="w-5 h-5 ml-2" />
                    </>
                  )}
                </GradientButton>

                <p className="text-sm text-muted-foreground text-center">
                  Ответ в Telegram или по телефону в течение 15 минут.
                </p>
              </form>
            )}
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold mb-4 font-serif">Прямые контакты</h3>
              <p className="text-muted-foreground">
                Если удобнее — пишите напрямую, мы всегда на связи.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target={item.href.startsWith("https") ? "_blank" : undefined}
                  rel={item.href.startsWith("https") ? "noopener noreferrer" : undefined}
                  className="glass rounded-xl p-4 flex items-center gap-4 card-hover block"
                >
                  <div className="p-3 rounded-lg bg-primary/10">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-foreground">{item.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="glass rounded-xl p-6">
              <h4 className="font-semibold mb-2">📍 Наш офис</h4>
              <p className="text-muted-foreground">
                Москва, Россия
                <br />
                <span className="text-sm">Работаем удалённо по всей России</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
