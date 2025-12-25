import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { Globe, Cloud, TrendingUp, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SolutionStat {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

interface Solution {
  id: string;
  title: string;
  navTitle: string;
  description: string;
  benefits: string[];
  stats: SolutionStat[];
  icon: LucideIcon;
}

const solutions: Solution[] = [
  {
    id: "websites",
    title: "Разработка веб-сайтов",
    navTitle: "Разработка",
    description: "Landing pages, корпоративные сайты, e-commerce",
    benefits: ["Адаптивный дизайн", "SEO-оптимизация", "Быстрая загрузка"],
    stats: [
      { value: 50, suffix: "+", label: "сайтов" },
      { value: 4.9, suffix: "/5", label: "отзывы", decimals: 1 }
    ],
    icon: Globe,
  },
  {
    id: "saas",
    title: "SaaS-платформы",
    navTitle: "SaaS",
    description: "Облачные сервисы для автоматизации бизнеса",
    benefits: ["Масштабируемость", "Интеграции API", "Cloud-first архитектура"],
    stats: [
      { value: 10, suffix: "+", label: "платформ" },
      { value: 99.9, suffix: "%", label: "uptime", decimals: 1 }
    ],
    icon: Cloud,
  },
  {
    id: "growth",
    title: "Оптимизация и рост",
    navTitle: "Оптимизация",
    description: "A/B-тестирование, конверсия, аналитика",
    benefits: ["+250% конверсии", "Снижение отказов", "Рост выручки"],
    stats: [
      { value: 5, suffix: "+ млн", label: "выручки" },
      { value: 500, suffix: "+", label: "клиентов" }
    ],
    icon: TrendingUp,
  },
];

const SolutionCard = ({ solution, index }: { solution: Solution; index: number }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const Icon = solution.icon;

  return (
    <motion.div
      ref={ref}
      id={solution.id}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="group relative h-[580px] rounded-3xl p-8 flex flex-col
        bg-gradient-to-br from-[hsl(var(--color-primary-01)/0.05)] to-[hsl(var(--color-accent-01)/0.05)]
        border border-[hsl(var(--color-primary-01)/0.1)]
        solution-card cursor-pointer"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--color-primary-01)/0.1)] flex items-center justify-center mb-6 
        group-hover:bg-[hsl(var(--color-primary-01)/0.2)] transition-colors duration-300">
        <Icon className="w-7 h-7 text-01-cyan" />
      </div>

      {/* Title & Description */}
      <h2 className="text-2xl font-bold text-foreground mb-3 font-serif">{solution.title}</h2>
      <p className="text-muted-foreground mb-6 leading-relaxed">{solution.description}</p>

      {/* Benefits list */}
      <ul className="space-y-3 mb-8 flex-grow">
        {solution.benefits.map((benefit, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--color-secondary-01))] flex-shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>

      {/* Stats with CountUp */}
      <div className="flex gap-10 mt-auto mb-4">
        {solution.stats.map((stat, i) => (
          <div key={i}>
            <div className="text-3xl font-bold text-01-cyan font-serif">
              {inView && (
                <CountUp 
                  end={stat.value} 
                  duration={2.5} 
                  suffix={stat.suffix} 
                  decimals={stat.decimals || 0}
                  delay={0.3}
                />
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Hover CTA */}
      <div className="absolute bottom-8 right-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <span className="flex items-center gap-2 text-01-cyan font-medium">
          Подробнее
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(var(--color-primary-01) / 0.08), transparent 70%)'
        }}
      />
    </motion.div>
  );
};

const Solutions = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !navRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionBottom = sectionTop + sectionRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const navHeight = navRef.current.offsetHeight;

      // Check if nav should be sticky
      setIsSticky(scrollY >= sectionTop - navHeight && scrollY < sectionBottom - 200);

      // Determine active section based on scroll position
      solutions.forEach((solution, index) => {
        const element = document.getElementById(solution.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section ref={sectionRef} id="solutions" className="py-24 relative">
      {/* Section Header */}
      <div className="container px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
            Наши <span className="text-01-cyan">решения</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Комплексные услуги для роста вашего бизнеса в интернете
          </p>
        </motion.div>
      </div>

      {/* Sticky Navigation */}
      <nav 
        ref={navRef}
        className={`${isSticky ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 bg-background/80 backdrop-blur-md border-b border-border/50 py-4 transition-all duration-300`}
      >
        <div className="container flex justify-center items-center gap-4 md:gap-8 px-4">
          <span className="font-bold text-foreground hidden sm:block">OWNDEV</span>
          <span className="hidden sm:block text-border">|</span>
          {solutions.map((sol, i) => (
            <button 
              key={sol.id}
              onClick={() => scrollToSection(sol.id)}
              className={`relative px-3 py-2 text-sm md:text-base font-medium transition-colors duration-300
                ${activeSection === i 
                  ? 'text-01-cyan' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {sol.navTitle}
              {activeSection === i && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--color-primary-01))]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer when nav is sticky */}
      {isSticky && <div className="h-[60px]" />}

      {/* Cards Grid */}
      <div className="container px-4 mt-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {solutions.map((solution, index) => (
            <SolutionCard key={solution.id} solution={solution} index={index} />
          ))}
        </div>
      </div>

      {/* "Работаем по всему миру" section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="container px-4 mt-20"
      >
        <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--color-primary-01) / 0.1), hsl(var(--color-accent-01) / 0.1))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--color-primary-01)/0.05)] to-transparent" />
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold font-serif mb-3">
              🌍 Работаем по <span className="text-01-cyan">всему миру</span>
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Удалённая команда с клиентами в России, СНГ и Европе. 
              Гибкий график встреч под любой часовой пояс.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Solutions;