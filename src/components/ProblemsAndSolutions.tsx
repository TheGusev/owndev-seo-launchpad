import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  ArrowRight, 
  Globe, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Zap,
  Shield,
  Coins,
  Bot,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

const ProblemsAndSolutions = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const problems: BentoItem[] = [
    {
      id: "problem-clients",
      title: "Сайт не приносит клиентов",
      description: "Старый дизайн, медленная загрузка, нет SEO. Посетители уходят через 3 секунды, конверсия близка к нулю.",
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      status: "Критично",
      tags: ["Дизайн", "SEO", "UX"],
      meta: "–80% трафика",
      colSpan: 2,
      hasPersistentHover: true,
      expandedContent: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Почему это происходит?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-400">Проблемы</span>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>• Устаревший дизайн 2015 года</li>
                <li>• Скорость загрузки 8+ секунд</li>
                <li>• Нет мобильной адаптации</li>
                <li>• SEO-ошибки на каждой странице</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-emerald-400">Наше решение</span>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>• Современный UI/UX дизайн</li>
                <li>• Загрузка менее 2 секунд</li>
                <li>• Mobile-first подход</li>
                <li>• Полная SEO-оптимизация</li>
              </ul>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-sm text-neutral-400">
              <span className="text-primary font-medium">Результат:</span> Увеличение конверсии на 200-400% в первые 3 месяца после запуска нового сайта.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "problem-system",
      title: "Нет унификации в системе",
      description: "Каждый проект с нуля, нет масштабирования. Время разработки увеличивается в 3 раза.",
      icon: <TrendingDown className="w-4 h-4 text-amber-500" />,
      status: "Проблема",
      tags: ["Процессы", "Масштаб"],
      meta: "×3 время",
      expandedContent: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Как мы это решаем?</h3>
          <p className="text-neutral-400">
            Используем модульную архитектуру и готовые компоненты. Каждый новый проект строится на проверенной базе, 
            что сокращает время разработки в 3-5 раз.
          </p>
          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-xl bg-neutral-900 text-center">
              <div className="text-2xl font-bold text-amber-500">3x</div>
              <div className="text-xs text-neutral-500">быстрее запуск</div>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-neutral-900 text-center">
              <div className="text-2xl font-bold text-amber-500">50+</div>
              <div className="text-xs text-neutral-500">готовых модулей</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "problem-cost",
      title: "Стоимость разработки 500K+ руб",
      description: "Не окупается на малом/среднем бизнесе. ROI уходит в минус на 12+ месяцев.",
      icon: <DollarSign className="w-4 h-4 text-red-500" />,
      status: "Дорого",
      tags: ["Бюджет", "ROI"],
      meta: "500K+ ₽",
      expandedContent: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Наш подход к ценообразованию</h3>
          <p className="text-neutral-400">
            Мы сократили стоимость на 30-50% благодаря автоматизации и готовым решениям. 
            Вы платите за результат, а не за часы работы.
          </p>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400 font-medium">ROI в плюс уже через 3-4 месяца</p>
          </div>
        </div>
      ),
    },
    {
      id: "problem-analytics",
      title: "Нет аналитики и отчетов",
      description: "Не понять, работает ли сайт вообще. Решения принимаются вслепую, без данных.",
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
      status: "Слепота",
      tags: ["Аналитика", "Данные"],
      meta: "0 метрик",
      colSpan: 2,
      expandedContent: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Полная прозрачность с первого дня</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="text-2xl font-bold text-purple-400">24/7</div>
              <div className="text-xs text-neutral-500">Мониторинг</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="text-2xl font-bold text-purple-400">15+</div>
              <div className="text-xs text-neutral-500">Метрик</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="text-2xl font-bold text-purple-400">1 клик</div>
              <div className="text-xs text-neutral-500">До отчёта</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const solutions: BentoItem[] = [
    {
      id: "solution-price",
      title: "Низкие цены, высокий результат",
      description: "На 30% дешевле конкурентов. Гарантия роста 150% за 6 месяцев. Платите только за результат.",
      icon: <Coins className="w-4 h-4 text-emerald-500" />,
      status: "Выгодно",
      tags: ["Экономия", "Гарантия"],
      meta: "–30% цена",
      cta: "Узнать цены →",
      colSpan: 2,
      hasPersistentHover: true,
      expandedContent: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Прозрачное ценообразование</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30">
              <div className="text-3xl font-bold text-emerald-400 mb-2">30%</div>
              <div className="text-sm text-neutral-400">Экономия vs конкуренты</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30">
              <div className="text-3xl font-bold text-emerald-400 mb-2">150%</div>
              <div className="text-sm text-neutral-400">Гарантия роста</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30">
              <div className="text-3xl font-bold text-emerald-400 mb-2">0₽</div>
              <div className="text-sm text-neutral-400">Скрытых платежей</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "solution-complex",
      title: "Комплексный подход",
      description: "Разработка + SEO + поддержка. Вы не думаете о техподдержке, мы берём всё на себя.",
      icon: <Shield className="w-4 h-4 text-sky-500" />,
      status: "Всё включено",
      tags: ["Разработка", "SEO", "Поддержка"],
      meta: "3 в 1",
      cta: "Подробнее →",
      expandedContent: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Что входит в пакет?</h3>
          <div className="space-y-3">
            {["Разработка сайта под ключ", "SEO-оптимизация", "Техническая поддержка 24/7", "Регулярные обновления", "Аналитика и отчёты"].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900">
                <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
                <span className="text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "solution-transparent",
      title: "Прозрачное ценообразование",
      description: "Платите за клиентов в бизнес, а не за красивый сайт. Фиксированные цены без скрытых платежей.",
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      status: "Честно",
      tags: ["Прозрачность", "Фикс"],
      meta: "0 сюрпризов",
      cta: "Смотреть тарифы →",
    },
    {
      id: "solution-saas",
      title: "Собственные SaaS-платформы",
      description: "Встраиваем AI, аналитику, автоматизацию. Результаты за неделю, а не за месяцы.",
      icon: <Bot className="w-4 h-4 text-violet-500" />,
      status: "AI-powered",
      tags: ["AI", "Аналитика", "Автоматизация"],
      meta: "7 дней",
      cta: "Демо →",
      colSpan: 2,
      expandedContent: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Наши SaaS решения</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <h4 className="font-medium text-violet-400 mb-2">AI-ассистент</h4>
              <p className="text-sm text-neutral-400">Автоматизация ответов клиентам, анализ обращений, персонализация.</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <h4 className="font-medium text-violet-400 mb-2">Аналитика</h4>
              <p className="text-sm text-neutral-400">Дашборды в реальном времени, прогнозы, рекомендации.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="problems" className="py-24 relative overflow-hidden">
      <ParallaxLayer speed={0.15} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
      </ParallaxLayer>
      <FloatingParticles count={12} className="absolute inset-0 z-[1] pointer-events-none" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Проблемы →{" "}
            <span className="text-gradient">Решения</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Мы понимаем боли вашего бизнеса и знаем, как их решить
          </p>
        </motion.div>

        <div ref={ref} className="space-y-16">
          {/* Problems - Horizontal Scroll */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold font-serif">
              С этим сталкиваются{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">все</span>
            </h3>
            <BentoGrid 
              items={problems} 
              layout="horizontal-scroll"
            />
          </motion.div>

          {/* Arrow connector */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex justify-center"
          >
            <div className="glass p-4 rounded-full border border-primary/20">
              <ArrowRight className="w-8 h-8 text-primary rotate-90 lg:rotate-0" />
            </div>
          </motion.div>

          {/* Solutions - Horizontal Scroll */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold font-serif">
              Как мы это{" "}
              <span className="text-gradient">решаем</span>
            </h3>
            <BentoGrid 
              items={solutions} 
              layout="horizontal-scroll"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsAndSolutions;
