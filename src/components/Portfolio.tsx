import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink, TrendingUp, Phone, DollarSign, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/ui/optimized-image";

const Portfolio = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const projects = [
    {
      title: "Салон красоты «Иридиум»",
      category: "Красота",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
      problem: "Нет сайта, потеря клиентов, сложная запись через WhatsApp",
      solution: "Разработали сайт с онлайн-записью, интегрировали SaaS систему управления, оптимизировали под SEO",
      results: {
        traffic: "+250%",
        calls: "+45/мес",
        roi: "2 месяца",
        rating: "4.9"
      },
      gradient: "from-pink-500/20 to-purple-500/20",
      placeholderColor: "hsl(330 60% 15%)"
    },
    {
      title: "Ремонтная компания «СтройМастер»",
      category: "Услуги",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
      problem: "Старый сайт, низкая конверсия, нет мобильной версии",
      solution: "Полный редизайн, калькулятор стоимости, портфолио с фильтрами, мобильная оптимизация",
      results: {
        traffic: "+180%",
        calls: "+62/мес",
        roi: "3 месяца",
        rating: "4.8"
      },
      gradient: "from-orange-500/20 to-red-500/20",
      placeholderColor: "hsl(25 60% 15%)"
    },
    {
      title: "Логистика «ФастДеливери»",
      category: "B2B",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop",
      problem: "Нет онлайн-заявок, ручной расчет стоимости, отсутствие аналитики",
      solution: "Личный кабинет клиента, автоматический расчет, интеграция с CRM",
      results: {
        traffic: "+120%",
        calls: "+89/мес",
        roi: "4 месяца",
        rating: "4.7"
      },
      gradient: "from-blue-500/20 to-cyan-500/20",
      placeholderColor: "hsl(200 60% 15%)"
    },
    {
      title: "Интернет-магазин «ТехноМир»",
      category: "E-commerce",
      image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop",
      problem: "Низкие продажи, отсутствие SEO, медленная загрузка",
      solution: "Новый магазин на современном стеке, SEO-оптимизация, интеграция платежей",
      results: {
        traffic: "+320%",
        calls: "+156/мес",
        roi: "2.5 месяца",
        rating: "4.9"
      },
      gradient: "from-green-500/20 to-emerald-500/20",
      placeholderColor: "hsl(140 60% 15%)"
    },
    {
      title: "Клиника «Здоровье Плюс»",
      category: "Медицина",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop",
      problem: "Неудобная запись, нет информации о врачах, низкое доверие",
      solution: "Онлайн-запись, профили врачей, отзывы пациентов, блог со статьями",
      results: {
        traffic: "+200%",
        calls: "+78/мес",
        roi: "3 месяца",
        rating: "4.9"
      },
      gradient: "from-teal-500/20 to-cyan-500/20",
      placeholderColor: "hsl(175 60% 15%)"
    },
    {
      title: "Фитнес-клуб «PowerGym»",
      category: "Услуги",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
      problem: "Нет онлайн-продаж абонементов, отсутствие расписания",
      solution: "Покупка абонементов онлайн, расписание тренировок, личный кабинет",
      results: {
        traffic: "+175%",
        calls: "+52/мес",
        roi: "2 месяца",
        rating: "4.8"
      },
      gradient: "from-violet-500/20 to-purple-500/20",
      placeholderColor: "hsl(270 60% 15%)"
    }
  ];

  return (
    <section id="portfolio" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Реальные проекты. <span className="text-gradient">Реальные результаты.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Смотрите, что мы сделали для наших клиентов
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {projects.map((project, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/2">
                  <div className={`glass rounded-2xl overflow-hidden h-full bg-gradient-to-br ${project.gradient}`}>
                    {/* Project image with overlay */}
                    <div className="relative h-48 overflow-hidden">
                      <OptimizedImage 
                        src={project.image} 
                        alt={project.title}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                        placeholderColor={project.placeholderColor}
                        fallbackSrc="https://placehold.co/800x600/1a1a1a/ffffff?text=Project"
                        eager={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="glass px-3 py-1 rounded-full inline-block mb-2">
                          <span className="text-xs font-medium text-foreground">{project.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-destructive mb-1">Какая была проблема:</h4>
                        <p className="text-sm text-muted-foreground">{project.problem}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-success mb-1">Что мы сделали:</h4>
                        <p className="text-sm text-muted-foreground">{project.solution}</p>
                      </div>
                      
                      {/* Results */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm">
                            <span className="font-bold text-success">{project.results.traffic}</span>
                            <span className="text-muted-foreground"> трафик</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            <span className="font-bold text-primary">{project.results.calls}</span>
                            <span className="text-muted-foreground"> звонков</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-warning" />
                          <span className="text-sm">
                            <span className="font-bold text-warning">{project.results.roi}</span>
                            <span className="text-muted-foreground"> ROI</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          <span className="text-sm">
                            <span className="font-bold">{project.results.rating}</span>
                            <span className="text-muted-foreground"> рейтинг</span>
                          </span>
                        </div>
                      </div>
                      
                      <GradientButton variant="variant" size="sm" className="w-full mt-4">
                        Смотреть живой сайт
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </GradientButton>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
            
            {/* Mobile swipe indicator */}
            <div className="flex md:hidden items-center justify-center gap-4 mt-6">
              <ChevronLeft className="w-5 h-5 text-muted-foreground animate-pulse" />
              <div className="flex gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current 
                        ? 'bg-primary w-6' 
                        : 'bg-muted-foreground/30 w-2'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground animate-pulse" />
            </div>
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default Portfolio;
