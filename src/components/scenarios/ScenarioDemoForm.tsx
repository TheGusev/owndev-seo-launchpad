import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const accentMap: Record<string, { border: string; glow: string; text: string }> = {
  cyan:    { border: "border-cyan-500/30",    glow: "shadow-[0_0_30px_hsl(190_80%_50%/0.15)]", text: "text-cyan-400" },
  violet:  { border: "border-violet-500/30",  glow: "shadow-[0_0_30px_hsl(270_80%_60%/0.15)]", text: "text-violet-400" },
  emerald: { border: "border-emerald-500/30", glow: "shadow-[0_0_30px_hsl(155_80%_45%/0.15)]", text: "text-emerald-400" },
  amber:   { border: "border-amber-500/30",   glow: "shadow-[0_0_30px_hsl(38_90%_55%/0.15)]",  text: "text-amber-400" },
};

interface ScenarioDemoFormProps {
  placeholder: string;
  buttonText: string;
  targetPath: string;
  queryParam: string;
  accentColor: "cyan" | "violet" | "emerald" | "amber";
  icon: LucideIcon;
}

const ScenarioDemoForm = ({ placeholder, buttonText, targetPath, queryParam, accentColor, icon: Icon }: ScenarioDemoFormProps) => {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const accent = accentMap[accentColor];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = queryParam === "url" && !trimmed.startsWith("http") ? `https://${trimmed}` : trimmed;
    navigate(`${targetPath}?${queryParam}=${encodeURIComponent(normalized)}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mx-auto max-w-xl p-6 rounded-2xl bg-card/40 backdrop-blur-sm border ${accent.border} ${accent.glow} mb-16`}
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${accent.text}`} />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 pl-10 bg-background/60"
          />
        </div>
        <Button
          type="submit"
          variant="hero"
          size="lg"
          disabled={!value.trim()}
          className="w-full sm:w-auto h-12 shrink-0"
        >
          {buttonText}
        </Button>
      </div>
    </motion.form>
  );
};

export default ScenarioDemoForm;
