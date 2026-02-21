import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Users } from "lucide-react";

const citiesData = [
  { name: "Москва", pop: 12600000 },
  { name: "Санкт-Петербург", pop: 5400000 },
  { name: "Новосибирск", pop: 1600000 },
  { name: "Екатеринбург", pop: 1500000 },
  { name: "Казань", pop: 1300000 },
  { name: "Нижний Новгород", pop: 1200000 },
  { name: "Челябинск", pop: 1100000 },
  { name: "Самара", pop: 1100000 },
  { name: "Омск", pop: 1100000 },
  { name: "Ростов-на-Дону", pop: 1100000 },
  { name: "Уфа", pop: 1100000 },
  { name: "Красноярск", pop: 1100000 },
];

const GEOCoverageMap = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]);
  };

  const totalPop = citiesData
    .filter((c) => selected.includes(c.name))
    .reduce((sum, c) => sum + c.pop, 0);

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 mb-8 justify-center">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Выбрано городов:</span>
          <span className="font-bold text-foreground">{selected.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Охват населения:</span>
          <span className="font-bold text-foreground">{(totalPop / 1_000_000).toFixed(1)}M</span>
        </div>
      </div>

      {/* City grid */}
      <div className="grid sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-2">
        {citiesData.map((city) => (
          <label
            key={city.name}
            className="flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors"
          >
            <Checkbox
              checked={selected.includes(city.name)}
              onCheckedChange={() => toggle(city.name)}
            />
            <span className="text-sm text-foreground flex-1">{city.name}</span>
            <span className="text-xs text-muted-foreground">{(city.pop / 1_000_000).toFixed(1)}M</span>
          </label>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Каждый выбранный город → отдельный GEO-кластер страниц.
      </p>
    </div>
  );
};

export default GEOCoverageMap;
