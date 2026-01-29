import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

const FloatingParticles = ({ count = 15, className }: FloatingParticlesProps) => {
  const [particleCount, setParticleCount] = useState(0);

  useEffect(() => {
    // Reduce particles on mobile
    const isMobile = window.innerWidth < 768;
    setParticleCount(isMobile ? Math.min(count, 6) : count);
  }, [count]);

  if (particleCount === 0) return null;

  return (
    <div className={cn("pointer-events-none", className)}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 bg-primary/40 rounded-full floating-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

export { FloatingParticles };
