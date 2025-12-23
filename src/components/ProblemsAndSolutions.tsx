import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { X, Check, ArrowRight } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

const ProblemsAndSolutions = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const problems = [
    {
      title: "Сайт не приносит клиентов",
      description: "Старый дизайн, медленная загрузка, нет SEO"
    },
    {
      title: "Нет унификации в системе",
      description: "Каждый проект с нуля, нет масштабирования"
    },
    {
      title: "Стоимость разработки 500K+ руб",
      description: "Не окупается на малом/среднем бизнесе"
    },
    {
      title: "Нет аналитики и отчетов",
      description: "Не понять, работает ли сайт вообще"
    }
  ];

  const solutions = [
    {
      title: "Низкие цены, высокий результат",
      description: "На 30% дешевле конкурентов. Гарантия роста 150% за 6 месяцев"
    },
    {
      title: "Комплексный подход",
      description: "Разработка + SEO + поддержка. Вы не думаете о техподдержке"
    },
    {
      title: "Прозрачное ценообразование",
      description: "Платите за клиентов в бизнес, а не за красивый сайт"
    },
    {
      title: "Собственные SaaS-платформы",
      description: "Встраиваем AI, аналитику, автоматизацию. Результаты за неделю"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

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

        <div ref={ref} className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Problems */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-destructive flex items-center gap-2 mb-8">
              <X className="w-6 h-6" />
              Проблемы наших клиентов
            </h3>
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <GlowingEffect
                  theme="destructive"
                  disabled={false}
                  borderWidth={2}
                  spread={25}
                  glow={true}
                  blur={8}
                />
                <div className="glass rounded-xl p-6 border-l-4 border-destructive/50 hover:border-destructive transition-colors relative z-10">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    {problem.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">{problem.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Arrow connector for desktop */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="glass p-4 rounded-full"
            >
              <ArrowRight className="w-8 h-8 text-primary" />
            </motion.div>
          </div>

          {/* Solutions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-success flex items-center gap-2 mb-8">
              <Check className="w-6 h-6" />
              Наше решение
            </h3>
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <GlowingEffect
                  theme="success"
                  disabled={false}
                  borderWidth={2}
                  spread={25}
                  glow={true}
                  blur={8}
                />
                <div className="glass rounded-xl p-6 border-l-4 border-success/50 hover:border-success transition-colors relative z-10">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    {solution.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">{solution.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemsAndSolutions;
