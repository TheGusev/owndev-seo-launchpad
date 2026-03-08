import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Calculator, TrendingUp } from "lucide-react";

interface CalcResult {
  leads: number;
  sales: number;
  revenue: number;
  profit: number;
  paybackMonths: number;
  roi: number;
}

const ROICalculatorTool = () => {
  const [avgCheck, setAvgCheck] = useState("");
  const [margin, setMargin] = useState("");
  const [traffic, setTraffic] = useState("");
  const [convLead, setConvLead] = useState("");
  const [convSale, setConvSale] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);

  const fields = [
    { label: "Средний чек (₽)", value: avgCheck, set: setAvgCheck, placeholder: "50000" },
    { label: "Маржинальность (%)", value: margin, set: setMargin, placeholder: "30" },
    { label: "Трафик / визиты в месяц", value: traffic, set: setTraffic, placeholder: "5000" },
    { label: "Конверсия в заявку (%)", value: convLead, set: setConvLead, placeholder: "3" },
    { label: "Конверсия заявки в продажу (%)", value: convSale, set: setConvSale, placeholder: "20" },
    { label: "Стоимость проекта / месяц (₽)", value: projectCost, set: setProjectCost, placeholder: "100000" },
  ];

  const canCalc = fields.every((f) => f.value.trim() !== "" && !isNaN(Number(f.value)));

  const calculate = () => {
    const ac = Number(avgCheck);
    const mg = Number(margin) / 100;
    const tr = Number(traffic);
    const cl = Number(convLead) / 100;
    const cs = Number(convSale) / 100;
    const cost = Number(projectCost);

    if (cost === 0) return;

    const leads = Math.round(tr * cl);
    const sales = Math.round(leads * cs);
    const revenue = sales * ac;
    const profit = revenue * mg;
    const paybackMonths = profit > 0 ? Math.ceil(cost / profit) : Infinity;
    const roi = Math.round(((profit - cost) / cost) * 100);

    setResult({ leads, sales, revenue, profit, paybackMonths, roi });
  };

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{f.label}</label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="bg-card border-border"
            />
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <GradientButton size="lg" onClick={calculate} disabled={!canCalc}>
          <Calculator className="w-5 h-5 mr-2" />
          Рассчитать ROI
        </GradientButton>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Заявок/мес", value: fmt(result.leads) },
              { label: "Продаж/мес", value: fmt(result.sales) },
              { label: "Выручка/мес", value: `${fmt(result.revenue)} ₽` },
              { label: "Прибыль/мес", value: `${fmt(result.profit)} ₽` },
              { label: "Окупаемость", value: result.paybackMonths === Infinity ? "—" : `${result.paybackMonths} мес.` },
              { label: "ROI", value: `${result.roi}%` },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className="text-xl font-bold text-primary">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {result.roi > 0
                ? `При текущих параметрах проект окупится за ${result.paybackMonths === Infinity ? "∞" : result.paybackMonths} мес. ROI составит ${result.roi}%.`
                : "При текущих параметрах проект не окупается. Попробуйте увеличить трафик или конверсию."}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        *Расчёты ориентировочные, не являются публичной офертой.
      </p>
    </div>
  );
};

export default ROICalculatorTool;
