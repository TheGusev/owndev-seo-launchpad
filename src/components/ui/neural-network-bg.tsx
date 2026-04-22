import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface NeuralNetworkBgProps {
  className?: string;
  density?: "low" | "medium" | "high";
  /** Opacity multiplier for the entire SVG, 0..1 */
  opacity?: number;
}

type Node = { x: number; y: number; r: number; delay: number };
type Edge = { a: number; b: number; delay: number; len: number };

const W = 1440;
const H = 800;

// Deterministic pseudo-random for stable SSR/CSR
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildGraph(count: number, seed: number): { nodes: Node[]; edges: Edge[] } {
  const rnd = seeded(seed);
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: 60 + rnd() * (W - 120),
      y: 60 + rnd() * (H - 120),
      r: 2 + rnd() * 1.6,
      delay: rnd() * 3,
    });
  }
  const edges: Edge[] = [];
  // Connect each node to its 2 nearest neighbours
  nodes.forEach((n, i) => {
    const dists = nodes
      .map((m, j) => ({ j, d: i === j ? Infinity : Math.hypot(n.x - m.x, n.y - m.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    dists.forEach(({ j, d }) => {
      if (!edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) {
        edges.push({ a: i, b: j, delay: rnd() * 4, len: d });
      }
    });
  });
  return { nodes, edges };
}

export const NeuralNetworkBg = ({
  className,
  density = "medium",
  opacity = 1,
}: NeuralNetworkBgProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const count = useMemo(() => {
    const base = density === "low" ? 14 : density === "high" ? 26 : 20;
    return isMobile ? Math.max(8, Math.round(base * 0.5)) : base;
  }, [density, isMobile]);

  const { nodes, edges } = useMemo(() => buildGraph(count, 42), [count]);

  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      style={{ contain: "layout paint", opacity }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="neural-node-glow">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <pattern id="neural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="hsl(var(--primary))" opacity="0.08" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#neural-grid)" />

        {edges.map((e, i) => {
          const a = nodes[e.a];
          const b = nodes[e.b];
          return (
            <line
              key={`l-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="hsl(var(--primary))"
              strokeOpacity="0.35"
              strokeWidth="0.6"
              className="neural-line"
              style={{ animationDelay: `${e.delay}s` }}
            />
          );
        })}

        {nodes.map((n, i) => (
          <g key={`n-${i}`}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r * 4}
              fill="url(#neural-node-glow)"
              opacity="0.25"
              className="neural-node"
              style={{ animationDelay: `${n.delay}s` }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="hsl(var(--primary))"
              opacity="0.9"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default NeuralNetworkBg;