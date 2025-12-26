import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useInView } from "react-intersection-observer";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Анна Морозова",
    role: "Владелица",
    company: "Салон «Аврора»",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    text: "Ребята превзошли все ожидания! Сайт не только красивый, но и приносит реальных клиентов. За первый месяц записи выросли на 40%.",
    rating: 5,
  },
  {
    id: 2,
    name: "Дмитрий Козлов",
    role: "CEO",
    company: "ГрузоТранс",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    text: "CRM-система полностью изменила наш бизнес. Теперь мы видим все заказы в реальном времени, а клиенты могут отслеживать груз онлайн.",
    rating: 5,
  },
  {
    id: 3,
    name: "Елена Васильева",
    role: "Директор",
    company: "Клиника «МедПлюс»",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
    text: "Личный кабинет пациента — это то, что нам было нужно. Пациенты довольны, врачи экономят время, а мы получаем больше записей.",
    rating: 5,
  },
  {
    id: 4,
    name: "Михаил Петров",
    role: "Основатель",
    company: "TechStore",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    text: "Интернет-магазин работает как часы. Интеграция с 1С экономит часы работы каждый день. Продажи растут каждый месяц.",
    rating: 5,
  },
  {
    id: 5,
    name: "Ольга Сидорова",
    role: "Управляющая",
    company: "PowerGym",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    text: "Мобильное приложение для нашего клуба — лучшая инвестиция года. Клиенты в восторге, а мы сократили нагрузку на ресепшн вдвое.",
    rating: 5,
  },
  {
    id: 6,
    name: "Алексей Иванов",
    role: "Шеф-повар",
    company: "Ресторан «Gusto»",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    text: "Система онлайн-заказов увеличила выручку на 35%. А программа лояльности возвращает гостей снова и снова.",
    rating: 5,
  },
  {
    id: 7,
    name: "Наталья Кузнецова",
    role: "Владелица",
    company: "Юридическое бюро",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
    text: "Профессиональный подход с первого дня. Сайт выглядит солидно и вызывает доверие у клиентов. Рекомендую!",
    rating: 5,
  },
  {
    id: 8,
    name: "Сергей Николаев",
    role: "Директор",
    company: "АвтоСервис «Мотор»",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    text: "Онлайн-запись на ТО увеличила загрузку мастеров на 60%. Клиенты ценят удобство, а мы — рост прибыли.",
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="break-inside-avoid mb-6"
    >
      <div className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300 group">
        {/* Quote icon */}
        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
        
        {/* Rating */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
          ))}
        </div>
        
        {/* Text */}
        <p className="text-foreground/90 text-sm md:text-base mb-6 leading-relaxed">
          "{testimonial.text}"
        </p>
        
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20">
            <OptimizedImage
              src={testimonial.avatar}
              alt={testimonial.name}
              containerClassName="w-full h-full"
            />
          </div>
          <div>
            <div className="font-semibold text-foreground">{testimonial.name}</div>
            <div className="text-sm text-muted-foreground">
              {testimonial.role}, {testimonial.company}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  const { ref: sectionRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section 
      ref={sectionRef}
      className="py-24 md:py-32 bg-background relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Отзывы <span className="text-gradient">клиентов</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Что говорят о нас те, кто уже работал с OWNDEV
          </p>
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.id} 
              testimonial={testimonial} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
