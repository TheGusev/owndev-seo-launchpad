import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { TrendingUp, Phone, DollarSign, Clock, Star } from "lucide-react";
import { MasonryGrid } from "@/components/ui/image-testimonial-grid";

const Results = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [columns, setColumns] = useState(4);

  const getColumns = (width: number) => {
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
  };

  useEffect(() => {
    const handleResize = () => setColumns(getColumns(window.innerWidth));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const metrics = [
    {
      icon: TrendingUp,
      value: 156,
      suffix: "%",
      label: "средний рост трафика за 6 месяцев",
      color: "text-success"
    },
    {
      icon: Phone,
      value: 89,
      suffix: "",
      label: "звонков в месяц в среднем за 6 месяцев",
      color: "text-primary"
    },
    {
      icon: DollarSign,
      value: 5.2,
      suffix: " млн ₽",
      decimals: 1,
      label: "дополнительной выручки клиентов от наших сайтов",
      color: "text-warning"
    },
    {
      icon: Clock,
      value: 4.5,
      suffix: " мес",
      decimals: 1,
      label: "средний ROI сайта (окупаемость)",
      color: "text-accent"
    }
  ];

  const testimonials = [
    {
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Константин",
      company: "Сантехника",
      feedback: "Просто супер! Сайт заработал уже в первый месяц! Спасибо, ребята! 🙌",
      mainImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/men/45.jpg",
      name: "Максим Иванов",
      company: "Клиника «Плюс»",
      feedback: "Лучшие в городе! Квалифицированные специалисты, честные цены, результаты!",
      mainImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&h=1000&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
      name: "Юлия Петрова",
      company: "Салон «Вива»",
      feedback: "Очень быстро! Приносит клиентов каждый день! Рекомендую всем.",
      mainImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&h=1200&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/men/56.jpg",
      name: "Андрей Смирнов",
      company: "СтройМастер",
      feedback: "Профессионалы своего дела. Сделали сайт точно по ТЗ и в срок.",
      mainImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Елена Козлова",
      company: "ТехноМир",
      feedback: "Отличная работа! Продажи выросли в 2 раза за 3 месяца.",
      mainImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&h=900&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/men/78.jpg",
      name: "Дмитрий Орлов",
      company: "АвтоСервис",
      feedback: "Заказов стало больше, клиенты находят нас сами. Очень доволен результатом!",
      mainImage: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&h=1100&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/women/88.jpg",
      name: "Ольга Новикова",
      company: "Ресторан «Вкус»",
      feedback: "Бронирования через сайт увеличились втрое. Спасибо за качественную работу!",
      mainImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      rating: 5
    },
    {
      profileImage: "https://randomuser.me/api/portraits/men/21.jpg",
      name: "Сергей Волков",
      company: "Юридическая фирма",
      feedback: "Наконец-то нашли надёжных подрядчиков. Сайт работает безупречно.",
      mainImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=1000&q=80",
      rating: 5
    }
  ];

  const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
      <img 
        src={testimonial.mainImage} 
        alt={testimonial.name}
        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
        onError={(e) => {
          e.currentTarget.src = 'https://placehold.co/800x600/1a1a1a/ffffff?text=Image';
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={testimonial.profileImage} 
            alt={testimonial.name}
            className="w-10 h-10 rounded-full border-2 border-primary/50 object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/40x40/EFEFEF/333333?text=A';
            }}
          />
          <div>
            <p className="text-foreground font-semibold text-sm">{testimonial.name}</p>
            <p className="text-muted-foreground text-xs">{testimonial.company}</p>
          </div>
        </div>
        
        <p className="text-foreground/90 text-sm leading-relaxed mb-3">"{testimonial.feedback}"</p>
        
        {/* Stars */}
        <div className="flex gap-1">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-warning fill-warning" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section id="results" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-muted/20 to-background" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Что достигли{" "}
            <span className="text-gradient">наши клиенты</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Реальные цифры и отзывы от реальных клиентов
          </p>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-6 text-center card-hover"
            >
              <metric.icon className={`w-10 h-10 mx-auto mb-4 ${metric.color}`} />
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {inView && (
                  <CountUp
                    start={0}
                    end={metric.value}
                    duration={2}
                    decimals={metric.decimals || 0}
                    suffix={metric.suffix}
                    className={metric.color}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials with Masonry Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8 font-serif">Отзывы клиентов</h3>
          
          <MasonryGrid columns={columns} gap={4}>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </MasonryGrid>
        </motion.div>
      </div>
    </section>
  );
};

export default Results;
