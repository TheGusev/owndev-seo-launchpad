import { Search, Brain, Globe, Code, FileText, BarChart3, BookOpen, Zap } from "lucide-react";

const gradients = [
  "from-primary/20 to-accent/20",
  "from-accent/20 to-primary/20",
  "from-primary/15 to-secondary/20",
  "from-secondary/20 to-accent/15",
  "from-accent/15 to-primary/15",
];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SEO: Search,
  LLM: Brain,
  pSEO: Globe,
  Schema: Code,
  "AI Overviews": Zap,
  Контент: BookOpen,
  Технический: BarChart3,
};

const DefaultBlogCover = ({ title, category }: { title: string; category?: string }) => {
  const hash = title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  const Icon = (category && categoryIcons[category]) || FileText;

  return (
    <div
      className={`relative w-full h-44 bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent_70%)]" />
      <Icon className="w-14 h-14 text-foreground/10" />
      {category && (
        <span className="absolute top-3 left-3 text-xs bg-primary/15 text-primary px-2 py-1 rounded-full border border-primary/20 font-medium">
          {category}
        </span>
      )}
    </div>
  );
};

export default DefaultBlogCover;
