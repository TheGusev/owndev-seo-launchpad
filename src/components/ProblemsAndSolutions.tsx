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
  Bot
} from "lucide-react";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

const ProblemsAndSolutions = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

const problems: BentoItem[] = [
    {
      title: "Сайт не приносит клиентов",
      description: "Старый дизайн, медленная загрузка, нет SEO. Посетители уходят через 3 секунды, конверсия близка к нулю.",
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      status: "Критично",
      tags: ["Дизайн", "SEO", "UX"],
      meta: "–80% трафика",
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Нет унификации в системе",
      description: "Каждый проект с нуля, нет масштабирования. Время разработки увеличивается в 3 раза.",
      icon: <TrendingDown className="w-4 h-4 text-amber-500" />,
      status: "Проблема",
      tags: ["Процессы", "Масштаб"],
      meta: "×3 время",
    },
    {
      title: "Стоимость разработки 500K+ руб",
      description: "Не окупается на малом/среднем бизнесе. ROI уходит в минус на 12+ месяцев.",
      icon: <DollarSign className="w-4 h-4 text-red-500" />,
      status: "Дорого",
      tags: ["Бюджет", "ROI"],
      meta: "500K+ ₽",
    },
    {
      title: "Нет аналитики и отчетов",
      description: "Не понять, работает ли сайт вообще. Решения принимаются вслепую, без данных.",
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
      status: "Слепота",
      tags: ["Аналитика", "Данные"],
      meta: "0 метрик",
      colSpan: 2,
    },
  ];

const solutions: BentoItem[] = [
    {
      title: "Низкие цены, высокий результат",
      description: "На 30% дешевле конкурентов. Гарантия роста 150% за 6 месяцев. Платите только за результат.",
      icon: <Coins className="w-4 h-4 text-emerald-500" />,
      status: "Выгодно",
      tags: ["Экономия", "Гарантия"],
      meta: "–30% цена",
      cta: "Узнать цены →",
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Комплексный подход",
      description: "Разработка + SEO + поддержка. Вы не думаете о техподдержке, мы берём всё на себя.",
      icon: <Shield className="w-4 h-4 text-sky-500" />,
      status: "Всё включено",
      tags: ["Разработка", "SEO", "Поддержка"],
      meta: "3 в 1",
      cta: "Подробнее →",
    },
    {
      title: "Прозрачное ценообразование",
      description: "Платите за клиентов в бизнес, а не за красивый сайт. Фиксированные цены без скрытых платежей.",
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      status: "Честно",
      tags: ["Прозрачность", "Фикс"],
      meta: "0 сюрпризов",
      cta: "Смотреть тарифы →",
    },
    {
      title: "Собственные SaaS-платформы",
      description: "Встраиваем AI, аналитику, автоматизацию. Результаты за неделю, а не за месяцы.",
      icon: <Bot className="w-4 h-4 text-violet-500" />,
      status: "AI-powered",
      tags: ["AI", "Аналитика", "Автоматизация"],
      meta: "7 дней",
      cta: "Демо →",
      colSpan: 2,
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

        <div ref={ref} className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-start">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold font-serif mb-6">
              С этим сталкиваются{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">все</span>
            </h3>
            <BentoGrid 
              items={problems} 
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            />
          </motion.div>

          {/* Arrow connector */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="hidden lg:flex items-center justify-center self-center"
          >
            <div className="glass p-4 rounded-full border border-primary/20">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Mobile arrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="lg:hidden flex justify-center"
          >
            <div className="glass p-3 rounded-full border border-primary/20 rotate-90">
              <ArrowRight className="w-6 h-6 text-primary" />
            </div>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold font-serif mb-6">
              Как мы это{" "}
              <span className="text-gradient">решаем</span>
            </h3>
            <BentoGrid 
              items={solutions} 
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsAndSolutions;
