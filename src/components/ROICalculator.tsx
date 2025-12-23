import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Calculator, TrendingUp, Clock, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CountUp from "react-countup";

const ROICalculator = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  const [service, setService] = useState("landing");
  const [revenue, setRevenue] = useState([500000]);

  const services = {
    landing: { name: "Лендинг", cost: 60000, growth: 0.25 },
    corporate: { name: "Корпоративный сайт", cost: 150000, growth: 0.35 },
    shop: { name: "Интернет-магазин", cost: 300000, growth: 0.50 },
    seo: { name: "SEO-продвижение", cost: 50000, growth: 0.40 },
    saas: { name: "SaaS-система", cost: 500000, growth: 0.60 },
  };

  const calculations = useMemo(() => {
    const selectedService = services[service as keyof typeof services];
    const currentRevenue = revenue[0];
    const growthAmount = currentRevenue * selectedService.growth;
    const monthlyGrowth = growthAmount / 12;
    const paybackMonths = Math.ceil(selectedService.cost / monthlyGrowth);
    const yearlyProfit = growthAmount - selectedService.cost;

    return {
      cost: selectedService.cost,
      growthPercent: Math.round(selectedService.growth * 100),
      growthAmount: Math.round(growthAmount),
      paybackMonths: Math.min(paybackMonths, 24),
      yearlyProfit: Math.round(yearlyProfit),
    };
  }, [service, revenue]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return `${Math.round(num / 1000)}K`;
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="roi-calculator" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Калькулятор окупаемости</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Рассчитайте свой <span className="text-gradient">ROI</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Узнайте, сколько вы заработаете с нашими услугами
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Service Selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">
                  Выберите услугу
                </label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="w-full h-14 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(services).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="text-lg py-3">
                        {value.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Revenue Slider */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">
                  Ваша текущая выручка в месяц
                </label>
                <div className="pt-2">
                  <Slider
                    value={revenue}
                    onValueChange={setRevenue}
                    min={100000}
                    max={10000000}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-3">
                    <span className="text-sm text-muted-foreground">100K ₽</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatNumber(revenue[0])} ₽
                    </span>
                    <span className="text-sm text-muted-foreground">10M ₽</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-2xl p-5 text-center bg-card/50">
                <Wallet className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  <CountUp
                    end={calculations.cost}
                    duration={0.5}
                    separator=" "
                    suffix=" ₽"
                    preserveValue
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Стоимость</p>
              </div>

              <div className="glass rounded-2xl p-5 text-center bg-success/10">
                <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-success">
                  +<CountUp
                    end={calculations.growthPercent}
                    duration={0.5}
                    suffix="%"
                    preserveValue
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Рост выручки</p>
              </div>

              <div className="glass rounded-2xl p-5 text-center bg-warning/10">
                <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-warning">
                  <CountUp
                    end={calculations.paybackMonths}
                    duration={0.5}
                    suffix=" мес"
                    preserveValue
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Окупаемость</p>
              </div>

              <div className="glass rounded-2xl p-5 text-center bg-primary/10">
                <Wallet className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  +<CountUp
                    end={calculations.yearlyProfit}
                    duration={0.5}
                    separator=" "
                    suffix=" ₽"
                    preserveValue
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Прибыль за год</p>
              </div>
            </div>

            <div className="text-center">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={scrollToContact}
                className="group"
              >
                Получить точный расчёт
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                * Расчёт примерный. Реальные результаты зависят от ниши и стратегии
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculator;
