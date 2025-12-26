import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import { useInView } from "react-intersection-observer";

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  metrics: {
    label: string;
    value: string;
  }[];
  link?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Салон красоты «Аврора»",
    category: "Бьюти",
    description: "Полный редизайн сайта и интеграция онлайн-записи. Увеличили конверсию в 3 раза.",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    metrics: [
      { label: "Рост трафика", value: "+180%" },
      { label: "Конверсия", value: "4.2%" },
      { label: "Срок", value: "3 нед" },
    ],
  },
  {
    id: 2,
    title: "Клиника «МедПлюс»",
    category: "Медицина",
    description: "Разработка личного кабинета пациента с историей визитов и онлайн-консультациями.",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    metrics: [
      { label: "Онлайн-записей", value: "+320%" },
      { label: "NPS", value: "72" },
      { label: "Срок", value: "6 нед" },
    ],
  },
  {
    id: 3,
    title: "Логистика «ГрузоТранс»",
    category: "B2B",
    description: "CRM-система для управления заказами и отслеживания грузов в реальном времени.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    metrics: [
      { label: "Автоматизация", value: "85%" },
      { label: "Экономия", value: "2.4M₽" },
      { label: "Срок", value: "8 нед" },
    ],
  },
  {
    id: 4,
    title: "Магазин «TechStore»",
    category: "E-commerce",
    description: "Интернет-магазин электроники с интеграцией 1C и автоматической синхронизацией остатков.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    metrics: [
      { label: "Рост продаж", value: "+240%" },
      { label: "AOV", value: "+35%" },
      { label: "Срок", value: "5 нед" },
    ],
  },
  {
    id: 5,
    title: "Фитнес-клуб «PowerGym»",
    category: "Спорт",
    description: "Мобильное приложение для бронирования тренировок и отслеживания прогресса.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    metrics: [
      { label: "Удержание", value: "+65%" },
      { label: "Активность", value: "89%" },
      { label: "Срок", value: "4 нед" },
    ],
  },
  {
    id: 6,
    title: "Ресторан «Gusto»",
    category: "HoReCa",
    description: "Система онлайн-заказов и программа лояльности с push-уведомлениями.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    metrics: [
      { label: "Онлайн-заказы", value: "+410%" },
      { label: "Повторные", value: "52%" },
      { label: "Срок", value: "4 нед" },
    ],
  },
];

const Portfolio = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    skipSnaps: false,
  });
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  
  const { ref: sectionRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section 
      ref={sectionRef}
      className="py-24 md:py-32 bg-background relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Наши <span className="text-gradient">проекты</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Реальные кейсы с измеримыми результатами
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                >
                  <div className="group relative h-[400px] md:h-[450px] rounded-2xl overflow-hidden border border-border/50 bg-card">
                    {/* Image */}
                    <OptimizedImage
                      src={project.image}
                      alt={project.title}
                      containerClassName="absolute inset-0"
                      className="group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full w-fit mb-3">
                        {project.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                        {project.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      {/* Metrics */}
                      <div className="flex gap-4 mb-4">
                        {project.metrics.map((metric, i) => (
                          <div key={i} className="text-center">
                            <div className="text-lg font-bold text-primary">{metric.value}</div>
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* CTA */}
                      <div className="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Подробнее</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="rounded-full border-border/50 hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {projects.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex 
                      ? "bg-primary w-6" 
                      : "bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full border-border/50 hover:border-primary hover:text-primary"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
