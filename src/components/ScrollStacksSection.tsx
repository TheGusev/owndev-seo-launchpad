import { useRef, useEffect } from "react";
import { 
  Globe, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Coins,
  Shield,
  Zap,
  Bot,
  Building2,
  ShoppingCart,
  Search,
  Rocket,
  MessageSquare,
  Clock,
  Banknote,
  Users
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  stickyTopDesktop: 110,
  stickyTopMobile: 88,
  stackOffsetY: 28,
  stackScaleStep: 0.018,
  revealThreshold: 0.35,
  revealDistance: 200,
  scaleRange: [0.985, 1] as const,
  stackedOpacity: 0.85,
  stackedScale: 0.985,
  stackTrigger: 0.8,
};

// ============================================
// DATA
// ============================================
const problemsData = [
  {
    title: "Сайт не приносит клиентов",
    description: "Старый дизайн, медленная загрузка, нет SEO. Посетители уходят через 3 секунды.",
    icon: Globe,
    iconColor: "text-blue-500",
    status: "Критично",
    statusColor: "bg-destructive/20 text-destructive",
    meta: "–80% трафика",
    tags: ["Дизайн", "SEO", "UX"],
  },
  {
    title: "Нет унификации в системе",
    description: "Каждый проект с нуля, нет масштабирования. Время разработки ×3.",
    icon: TrendingDown,
    iconColor: "text-amber-500",
    status: "Проблема",
    statusColor: "bg-warning/20 text-warning",
    meta: "×3 время",
    tags: ["Процессы", "Масштаб"],
  },
  {
    title: "Стоимость разработки 500K+",
    description: "Не окупается на малом/среднем бизнесе. ROI уходит в минус.",
    icon: DollarSign,
    iconColor: "text-red-500",
    status: "Дорого",
    statusColor: "bg-destructive/20 text-destructive",
    meta: "500K+ ₽",
    tags: ["Бюджет", "ROI"],
  },
  {
    title: "Нет аналитики и отчетов",
    description: "Не понять, работает ли сайт. Решения принимаются вслепую.",
    icon: BarChart3,
    iconColor: "text-purple-500",
    status: "Слепота",
    statusColor: "bg-secondary/20 text-secondary",
    meta: "0 метрик",
    tags: ["Аналитика"],
  },
];

const solutionsData = [
  {
    title: "Низкие цены, высокий результат",
    description: "На 30% дешевле конкурентов. Гарантия роста 150% за 6 месяцев.",
    icon: Coins,
    iconColor: "text-emerald-500",
    status: "Выгодно",
    statusColor: "bg-success/20 text-success",
    meta: "–30% цена",
    tags: ["Экономия", "Гарантия"],
  },
  {
    title: "Комплексный подход",
    description: "Разработка + SEO + поддержка. Всё в одном месте.",
    icon: Shield,
    iconColor: "text-sky-500",
    status: "Всё включено",
    statusColor: "bg-accent/20 text-accent",
    meta: "3 в 1",
    tags: ["Разработка", "SEO"],
  },
  {
    title: "Прозрачное ценообразование",
    description: "Платите за клиентов, а не за красивый сайт. Фиксированные цены.",
    icon: Zap,
    iconColor: "text-yellow-500",
    status: "Честно",
    statusColor: "bg-warning/20 text-warning-foreground",
    meta: "0 сюрпризов",
    tags: ["Прозрачность"],
  },
  {
    title: "Собственные SaaS-платформы",
    description: "Встраиваем AI, аналитику, автоматизацию. Результат за неделю.",
    icon: Bot,
    iconColor: "text-violet-500",
    status: "AI-powered",
    statusColor: "bg-secondary/20 text-secondary",
    meta: "7 дней",
    tags: ["AI", "Автоматизация"],
  },
];

const servicesData = [
  {
    title: "Landing Page / Лендинг",
    goal: "Продажи, лиды, регистрация",
    duration: "5 дней",
    price: "от 40,000 ₽",
    audience: "Стартапы, услуги, акции",
    icon: Globe,
    color: "primary",
  },
  {
    title: "Корпоративный сайт",
    goal: "Имидж, информация, контакты",
    duration: "2-3 недели",
    price: "от 90,000 ₽",
    audience: "Компании, агентства",
    icon: Building2,
    color: "accent",
  },
  {
    title: "Интернет-магазин",
    goal: "E-commerce, продажи товаров",
    duration: "3-4 недели",
    price: "от 120,000 ₽",
    audience: "Розница, товары",
    icon: ShoppingCart,
    color: "secondary",
  },
  {
    title: "SEO-оптимизация",
    goal: "Органический трафик",
    duration: "от 6 месяцев",
    price: "от 60,000 ₽/мес",
    audience: "B2B, услуги",
    icon: Search,
    color: "success",
  },
  {
    title: "SaaS-платформа",
    goal: "Масштабирование, recurring",
    duration: "2-3 месяца",
    price: "от 300,000 ₽",
    audience: "Салоны, клиники",
    icon: Rocket,
    color: "primary",
  },
  {
    title: "Консультация + Аудит",
    goal: "Понять, что нужно бизнесу",
    duration: "1-2 дня",
    price: "БЕСПЛАТНО",
    audience: "Все",
    icon: MessageSquare,
    color: "accent",
    highlight: true,
  },
];

// ============================================
// STACK CARD COMPONENT
// ============================================
interface StackCardProps {
  children: React.ReactNode;
  index: number;
  totalCards: number;
  stickyTop: number;
  isMobile?: boolean;
}

const StackCard = ({ children, index, totalCards, stickyTop, isMobile = false }: StackCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const topOffset = stickyTop + index * CONFIG.stackOffsetY;
  const scale = isMobile ? 1 : 1 - index * CONFIG.stackScaleStep;
  const zIndex = isMobile ? 10 + index : totalCards - index;

  return (
    <div
      ref={cardRef}
      className="stack-card sticky will-change-transform"
      data-progress="0"
      data-sticky-top={topOffset}
      style={{
        top: `${topOffset}px`,
        zIndex,
        transformOrigin: 'top center',
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// PROBLEM CARD
// ============================================
interface ProblemCardData {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  status: string;
  statusColor: string;
  meta: string;
  tags: string[];
}

const ProblemCard = ({ data }: { data: ProblemCardData }) => {
  const Icon = data.icon;
  return (
    <div className="glass rounded-2xl p-5 border border-destructive/20 hover:border-destructive/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${data.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${data.statusColor}`}>
          {data.status}
        </span>
      </div>
      <h4 className="font-bold text-base mb-2">{data.title}</h4>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{data.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {data.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs font-mono text-destructive">{data.meta}</span>
      </div>
    </div>
  );
};

// ============================================
// SOLUTION CARD
// ============================================
const SolutionCard = ({ data }: { data: ProblemCardData }) => {
  const Icon = data.icon;
  return (
    <div className="glass rounded-2xl p-5 border border-success/20 hover:border-success/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${data.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${data.statusColor}`}>
          {data.status}
        </span>
      </div>
      <h4 className="font-bold text-base mb-2">{data.title}</h4>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{data.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {data.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs font-mono text-success">{data.meta}</span>
      </div>
    </div>
  );
};

// ============================================
// SERVICE CARD
// ============================================
interface ServiceCardData {
  title: string;
  goal: string;
  duration: string;
  price: string;
  audience: string;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
}

const getColorClasses = (color: string) => {
  const colors: Record<string, { border: string; icon: string }> = {
    primary: { border: "border-t-primary", icon: "text-primary" },
    accent: { border: "border-t-accent", icon: "text-accent" },
    secondary: { border: "border-t-secondary", icon: "text-secondary" },
    success: { border: "border-t-success", icon: "text-success" },
  };
  return colors[color] || colors.primary;
};

const ServiceCard = ({ data }: { data: ServiceCardData }) => {
  const Icon = data.icon;
  const colorClasses = getColorClasses(data.color);
  
  return (
    <div className={`glass rounded-2xl p-5 border-t-4 ${colorClasses.border} ${data.highlight ? 'ring-2 ring-primary/50' : ''}`}>
      {data.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Рекомендуем
          </span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${colorClasses.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-sm leading-tight pt-1">{data.title}</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">🎯</span>
          <span className="text-foreground text-xs">{data.goal}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground text-xs">{data.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`font-semibold text-xs ${data.highlight ? 'text-success' : 'text-foreground'}`}>
            {data.price}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground text-xs">{data.audience}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STACK COLUMN
// ============================================
interface StackColumnProps {
  title: string;
  titleAccent: string;
  accentColor: string;
  children: React.ReactNode;
}

const StackColumn = ({ title, titleAccent, accentColor, children }: StackColumnProps) => {
  return (
    <div className="stack-column">
      <h3 className="text-xl md:text-2xl font-bold font-serif mb-6 sticky top-20 z-50 bg-background/80 backdrop-blur-sm py-2">
        {title}{" "}
        <span className={accentColor}>{titleAccent}</span>
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ScrollStacksSection = () => {
  const isMobile = useIsMobile();
  const stickyTop = isMobile ? CONFIG.stickyTopMobile : CONFIG.stickyTopDesktop;
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId = 0;
    const cachedStickyTops = new Map<HTMLElement, number>();

    const updateProgress = () => {
      const cards = section.querySelectorAll<HTMLElement>('.stack-card');
      
      // Cache sticky tops on first run
      if (cachedStickyTops.size === 0) {
        cards.forEach((card) => {
          const st = parseFloat(card.dataset.stickyTop || '0');
          cachedStickyTops.set(card, st);
        });
      }

      const cardArray = Array.from(cards);
      
      cardArray.forEach((card, i) => {
        const st = cachedStickyTops.get(card) || 0;
        const rect = card.getBoundingClientRect();
        const distFromSticky = rect.top - st;
        const p = Math.min(1, Math.max(0, 1 - distFromSticky / CONFIG.revealDistance));
        
        card.style.setProperty('--p', p.toFixed(3));
        card.dataset.progress = p.toFixed(2);
        
        if (p > 0) {
          card.classList.add('is-visible');
        }

        // Mark previous card as stacked
        if (i > 0 && p > CONFIG.stackTrigger) {
          cardArray[i - 1].classList.add('is-stacked');
        } else if (i > 0 && p <= CONFIG.stackTrigger) {
          cardArray[i - 1].classList.remove('is-stacked');
        }
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial calculation
    requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  return (
    <section id="scroll-stacks" ref={sectionRef} className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Проблемы →{" "}
            <span className="text-gradient">Решения</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Мы понимаем боли вашего бизнеса и знаем, как их решить
          </p>
        </div>

        {/* Desktop: 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 pb-32">
          {/* Problems Column */}
          <StackColumn 
            title="С этим сталкиваются" 
            titleAccent="все"
            accentColor="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
          >
            {problemsData.map((problem, index) => (
              <StackCard 
                key={problem.title} 
                index={index} 
                totalCards={problemsData.length}
                stickyTop={stickyTop + 48}
              >
                <ProblemCard data={problem} />
              </StackCard>
            ))}
          </StackColumn>

          {/* Solutions Column */}
          <StackColumn 
            title="Как мы это" 
            titleAccent="решаем"
            accentColor="text-gradient"
          >
            {solutionsData.map((solution, index) => (
              <StackCard 
                key={solution.title} 
                index={index} 
                totalCards={solutionsData.length}
                stickyTop={stickyTop + 48}
              >
                <SolutionCard data={solution} />
              </StackCard>
            ))}
          </StackColumn>

          {/* Services Column */}
          <StackColumn 
            title="Что мы можем" 
            titleAccent="разработать"
            accentColor="text-gradient"
          >
            {servicesData.map((service, index) => (
              <StackCard 
                key={service.title} 
                index={index} 
                totalCards={servicesData.length}
                stickyTop={stickyTop + 48}
              >
                <ServiceCard data={service} />
              </StackCard>
            ))}
          </StackColumn>
        </div>

        {/* Mobile: Sequential stacks */}
        <div className="md:hidden space-y-16 pb-16">
          {/* Problems */}
          <StackColumn 
            title="С этим сталкиваются" 
            titleAccent="все"
            accentColor="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
          >
            {problemsData.map((problem, index) => (
              <StackCard 
                key={problem.title} 
                index={index} 
                totalCards={problemsData.length}
                stickyTop={stickyTop + 40}
                isMobile
              >
                <ProblemCard data={problem} />
              </StackCard>
            ))}
          </StackColumn>

          {/* Solutions */}
          <StackColumn 
            title="Как мы это" 
            titleAccent="решаем"
            accentColor="text-gradient"
          >
            {solutionsData.map((solution, index) => (
              <StackCard 
                key={solution.title} 
                index={index} 
                totalCards={solutionsData.length}
                stickyTop={stickyTop + 40}
                isMobile
              >
                <SolutionCard data={solution} />
              </StackCard>
            ))}
          </StackColumn>

          {/* Services */}
          <StackColumn 
            title="Что мы можем" 
            titleAccent="разработать"
            accentColor="text-gradient"
          >
            {servicesData.map((service, index) => (
              <StackCard 
                key={service.title} 
                index={index} 
                totalCards={servicesData.length}
                stickyTop={stickyTop + 40}
                isMobile
              >
                <ServiceCard data={service} />
              </StackCard>
            ))}
          </StackColumn>
        </div>
      </div>
    </section>
  );
};

export default ScrollStacksSection;
