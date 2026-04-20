import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Star {
  angle: number;
  distance: number;
  size: number;
  opacity: number;
  speed: number;
  twinkle: boolean;
  color: 'primary' | 'accent' | 'white';
}

interface StarfieldBackgroundProps {
  count?: number;
  className?: string;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => {
    const distance = 5 + Math.random() * 45;
    return {
      angle: Math.random() * 360,
      distance,
      size: 0.5 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.6,
      speed: 8 + (distance / 50) * 20 + Math.random() * 10,
      twinkle: Math.random() > 0.6,
      color: Math.random() > 0.7 ? 'accent' : Math.random() > 0.4 ? 'primary' : 'white',
    };
  });
}

const colorMap = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  white: 'bg-white',
};

const StarfieldBackground = ({ count = 100, className }: StarfieldBackgroundProps) => {
  const [starCount, setStarCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setStarCount(mobile ? Math.min(count, 35) : count);
  }, [count]);

  const stars = useMemo(() => generateStars(starCount, isMobile), [starCount, isMobile]);

  if (starCount === 0) return null;

  return (
    <div className={cn('pointer-events-none overflow-hidden', className)}>
      {stars.map((star, i) => {
        const rad = (star.angle * Math.PI) / 180;
        const x = 50 + star.distance * Math.cos(rad);
        const y = 50 + star.distance * Math.sin(rad);
        const driftDist = 10 + star.distance * 0.8;
        const dx = Math.cos(rad) * driftDist;
        const dy = Math.sin(rad) * driftDist;

        return (
          <div
            key={i}
            className={cn(
              'absolute rounded-full starfield-drift',
              star.twinkle && 'starfield-twinkle',
              colorMap[star.color]
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              '--drift-dx': `${dx}vh`,
              '--drift-dy': `${dy}vh`,
              '--drift-speed': `${star.speed}s`,
              animationDelay: `${Math.random() * star.speed}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export { StarfieldBackground };
