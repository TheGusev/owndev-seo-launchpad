import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Send, Loader2, CheckCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50),
  phone: z.string().min(10, "Введите корректный номер телефона").max(20),
  email: z.string().email("Введите корректный email").max(100),
  service: z.string().min(1, "Выберите услугу"),
  message: z.string().max(500).optional(),
  consent: z.boolean().refine((val) => val === true, "Необходимо согласие")
});

type FormData = z.infer<typeof formSchema>;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: "",
      message: "",
      consent: false
    }
  });

  const serviceLabels: Record<string, string> = {
    "pseo-setup": "Настройка pSEO‑проекта",
    "content-gen": "Генерация контента",
    "seo-audit": "SEO‑аудит",
    "ai-optimization": "Оптимизация под AI‑поиск",
    "custom": "Кастомная доработка",
    consultation: "Консультация"
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    const serviceLabel = serviceLabels[data.service] || data.service;

    try {
      const { data: result, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          service: serviceLabel,
          message: data.message || '',
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в течение 15 минут.",
      });

      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку. Попробуйте позвонить нам.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { value: "pseo-setup", label: "Настройка pSEO‑проекта" },
    { value: "content-gen", label: "Генерация контента" },
    { value: "seo-audit", label: "SEO‑аудит" },
    { value: "ai-optimization", label: "Оптимизация под AI‑поиск" },
    { value: "custom", label: "Кастомная доработка" },
    { value: "consultation", label: "Консультация" }
  ];

  const contactInfo = [
    { icon: Phone, label: "Телефон", value: "8 (906) 998-98-88", href: "tel:89069989888" },
    { icon: Mail, label: "Email", value: "west-centro@mail.ru", href: "mailto:west-centro@mail.ru" },
    { icon: MessageCircle, label: "Telegram", value: "@one_help", href: "https://t.me/one_help?text=owndev" }
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
            Нужны кастомные <span className="text-gradient">доработки?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Если нужны кастомные доработки или сопровождение — напишите, платформа остаётся бесплатной.
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle className="w-20 h-20 text-success mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Заявка отправлена!</h3>
                <p className="text-muted-foreground text-center">
                  Мы свяжемся с вами в течение 15 минут.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ваше имя *</FormLabel>
                          <FormControl>
                            <Input placeholder="Иван Петров" {...field} className="bg-card border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер телефона *</FormLabel>
                          <FormControl>
                            <Input placeholder="+7 (999) 123-45-67" {...field} className="bg-card border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="ivan@company.ru" {...field} className="bg-card border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Выберите услугу *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card border-border">
                                <SelectValue placeholder="Выберите услугу" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {service.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Кратко опишите задачу (опционально)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Расскажите о вашем проекте..." 
                            {...field} 
                            className="bg-card border-border min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-muted-foreground font-normal cursor-pointer">
                            Я согласен с{" "}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              политикой конфиденциальности
                            </a>{" "}
                            и{" "}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              пользовательским соглашением
                            </a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <GradientButton 
                    type="submit" 
                    size="xl" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Отправляем...
                      </>
                    ) : (
                      <>
                        Записаться на консультацию
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </GradientButton>

                  <p className="text-sm text-muted-foreground text-center">
                    * Как скоро я услышу ответ? В течение 15 минут.
                  </p>
                </form>
              </Form>
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
              <h3 className="text-2xl font-bold mb-4 font-serif">Или свяжитесь с нами напрямую</h3>
              <p className="text-muted-foreground">
                Мы всегда на связи и готовы ответить на ваши вопросы
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target={item.href.startsWith('https') ? '_blank' : undefined}
                  rel={item.href.startsWith('https') ? 'noopener noreferrer' : undefined}
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
