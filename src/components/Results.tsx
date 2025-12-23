import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { TrendingUp, Phone, DollarSign, Clock, Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const Results = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

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
      rating: 5,
      text: "Просто супер! Сайт заработал уже в первый месяц! Спасибо, ребята! 🙌",
      author: "Константин",
      company: "Сантехника",
      avatar: "К"
    },
    {
      rating: 5,
      text: "Лучшие в городе! Квалифицированные специалисты, честные цены, результаты!",
      author: "Максим Иванов",
      company: "Клиника «Плюс»",
      avatar: "М"
    },
    {
      rating: 5,
      text: "Очень быстро! Приносит клиентов каждый день! Рекомендую всем.",
      author: "Юлия Петрова",
      company: "Салон «Вива»",
      avatar: "Ю"
    },
    {
      rating: 5,
      text: "Профессионалы своего дела. Сделали сайт точно по ТЗ и в срок.",
      author: "Андрей Смирнов",
      company: "СтройМастер",
      avatar: "А"
    },
    {
      rating: 5,
      text: "Отличная работа! Продажи выросли в 2 раза за 3 месяца.",
      author: "Елена Козлова",
      company: "ТехноМир",
      avatar: "Е"
    }
  ];

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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Что достигли <span className="text-gradient">наши клиенты</span>
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

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">Отзывы клиентов</h3>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="glass rounded-2xl p-6 h-full">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-foreground mb-6 italic">"{testimonial.text}"</p>
                    
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default Results;
