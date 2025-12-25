import { useState, ReactNode, MouseEvent } from "react";

interface RippleType {
  x: number;
  y: number;
  id: number;
}

interface ClickRippleProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

const ClickRipple = ({ children, className = "", color }: ClickRippleProps) => {
  const [ripples, setRipples] = useState<RippleType[]>([]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
            backgroundColor: color || "hsl(var(--primary) / 0.3)",
          }}
        />
      ))}
    </div>
  );
};

export default ClickRipple;
