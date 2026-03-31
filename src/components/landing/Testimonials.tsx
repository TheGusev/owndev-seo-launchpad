import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const testimonials = [
  {
    name: "Алексей Морозов",
    role: "SEO-специалист",
    company: "Digital-агентство «Рост»",
    avatar: "АМ",
    avatarBg: "bg-blue-500/20 text-blue-400",
    rating: 5,
    text: "Наконец-то инструмент который реально проверяет GEO-готовность. Нашёл llms.txt-проблемы у 8 из 10 клиентских сайтов. PDF-отчёт отправляем клиентам как часть аудита — выглядит профессионально.",
    highlight: "PDF-отчёт отправляем клиентам",
    tag: "SEO-аудит",
  },
  {
    name: "Марина Соколова",
    role: "Владелица бизнеса",
    company: "Студия «ЛазерМед»",
    avatar: "МС",
    avatarBg: "bg-pink-500/20 text-pink-400",
    rating: 5,
    text: "Запустила рекламу в Директе, потратила 30 000 ₽ — ноль заявок. OWNDEV показал 11 критических ошибок. Исправила за неделю, запустила снова — пошли звонки. Жалею что не проверила сайт раньше.",
    highlight: "11 критических ошибок → пошли звонки",
    tag: "Яндекс.Директ",
  },
  {
    name: "Дмитрий Павлов",
    role: "Технический директор",
    company: "SaaS-стартап «Кинда»",
    avatar: "ДП",
    avatarBg: "bg-emerald-500/20 text-emerald-400",
    rating: 5,
    text: "AI Score был 34/100. За месяц подняли до 71: добавили llms.txt, FAQPage Schema, переписали структуру контента. Сайт начал появляться в ответах Perplexity и Яндекс Нейро. GEO — это реально работает.",
    highlight: "AI Score 34 → 71 за месяц",
    tag: "GEO-аудит",
  },
  {
    name: "Ольга Ткаченко",
    role: "Маркетолог",
    company: "Юридическое бюро «Право»",
    avatar: "ОТ",
    avatarBg: "bg-purple-500/20 text-purple-400",
    rating: 5,
    text: "Семантическое ядро из 150 запросов — это огонь. Раньше платили 5 000 ₽ копирайтеру за сбор 30-40 ключей. Здесь за 2 минуты получаешь 150 запросов с кластерами, интентами и частотой.",
    highlight: "150 запросов за 2 минуты",
    tag: "Семантика",
  },
  {
    name: "Игорь Назаров",
    role: "Разработчик",
    company: "Фриланс",
    avatar: "ИН",
    avatarBg: "bg-orange-500/20 text-orange-400",
    rating: 5,
    text: "Использую для сдачи сайтов клиентам. Прогоняю через OWNDEV, показываю отчёт как доказательство что сайт правильно настроен. Schema Generator экономит 2-3 часа на каждом проекте.",
    highlight: "Schema Generator экономит 2-3 часа",
    tag: "Schema.org",
  },
  {
    name: "Татьяна Воронова",
    role: "Контент-маркетолог",
    company: "E-commerce «СтильДом»",
    avatar: "ТВ",
    avatarBg: "bg-indigo-500/20 text-indigo-400",
    rating: 5,
    text: "Анализ конкурентов — лучшее что есть в OWNDEV. Вижу структуру топ-10 сайтов: сколько слов, какие H2, есть ли FAQ. Это даёт конкретный план: пишем контент лучше конкурентов по каждому параметру.",
    highlight: "Конкретный план на основе конкурентов",
    tag: "Конкуренты",
  },
];

const scrollToInput = () => {
  document.getElementById("site-check-input")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    (document.querySelector("#site-check-input input") as HTMLInputElement)?.focus();
  }, 600);
};

const Testimonials = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />

      <div className="container px-4 md:px-6 max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs">
            ⭐ Отзывы клиентов
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-serif">
            Что говорят{" "}
            <span className="text-gradient">пользователи</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            SEO-специалисты, маркетологи и владельцы бизнеса уже используют OWNDEV для роста трафика
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="text-yellow-400">★★★★★</span>
            <span>4.9 из 5</span>
            <span>·</span>
            <span>500+ аудитов</span>
            <span>·</span>
            <span>Рунет</span>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className="rounded-2xl border border-border/50 bg-card/40 p-5 space-y-4 hover:border-border transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.avatarBg}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                    <p className="text-xs text-muted-foreground/60">{t.company}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 text-yellow-400 text-xs">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>
              </div>

              {/* Text */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{t.text}"
              </p>

              {/* Highlight */}
              <div className="border-l-2 border-primary/50 pl-3">
                <p className="text-xs font-semibold text-primary">{t.highlight}</p>
              </div>

              {/* Tag + Verified */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  #{t.tag}
                </span>
                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                  <span className="text-emerald-400">✓</span> Проверено
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10 space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Присоединяйтесь к сотням пользователей OWNDEV
          </p>
          <button
            onClick={scrollToInput}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-primary/20 border border-primary/30 text-foreground hover:bg-primary/30 active:scale-95 transition-all min-h-[44px]"
          >
            Проверить свой сайт →
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
