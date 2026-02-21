import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Clock, Wallet, Users } from "lucide-react";
import CountUp from "react-countup";

const ROICalculatorTool = () => {
  const [cities, setCities] = useState([10]);
  const [pagesPerCity, setPagesPerCity] = useState([5]);

  const calc = useMemo(() => {
    const totalPages = cities[0] * pagesPerCity[0];
    const monthlyTraffic = totalPages * 120;
    const leads = Math.round(monthlyTraffic * 0.025);
    const roi = Math.round((monthlyTraffic * 15 - 30000) / 30000 * 100);
    return { totalPages, monthlyTraffic, leads, roi: Math.max(roi, 0) };
  }, [cities, pagesPerCity]);

  const stats = [
    { icon: Users, label: "Страниц", value: calc.totalPages, suffix: "", color: "text-primary" },
    { icon: TrendingUp, label: "Трафик/мес", value: calc.monthlyTraffic, suffix: "", color: "text-success" },
    { icon: Clock, label: "Лидов/мес", value: calc.leads, suffix: "", color: "text-warning" },
    { icon: Wallet, label: "ROI", value: calc.roi, suffix: "%", color: "text-primary" },
  ];

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Количество городов: {cities[0]}</label>
            <Slider value={cities} onValueChange={setCities} min={1} max={80} step={1} />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Страниц на город: {pagesPerCity[0]}</label>
            <Slider value={pagesPerCity} onValueChange={setPagesPerCity} min={1} max={20} step={1} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <div className={`text-2xl font-bold ${s.color}`}>
                <CountUp end={s.value} duration={0.4} separator=" " suffix={s.suffix} preserveValue />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        *Расчёты ориентировочные, не являются публичной офертой.
      </p>
    </div>
  );
};

export default ROICalculatorTool;
