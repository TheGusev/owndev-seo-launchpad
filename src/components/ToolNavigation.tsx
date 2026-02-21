import { Sparkles, Shield, Bot, Calculator, MapPin } from "lucide-react";

const tools = [
  { id: "tool-generator", label: "1. Generator", icon: Sparkles },
  { id: "tool-anti-duplicate", label: "2. Anti-Duplicate", icon: Shield },
  { id: "tool-ai-check", label: "3. AI Check", icon: Bot },
  { id: "tool-roi", label: "4. ROI", icon: Calculator },
  { id: "tool-geo", label: "5. GEO Map", icon: MapPin },
];

const ToolNavigation = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-16 md:top-20 z-40 glass border-b border-border/50 py-3">
      <div className="container px-4 md:px-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => scrollTo(tool.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-card/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors whitespace-nowrap shrink-0"
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default ToolNavigation;
