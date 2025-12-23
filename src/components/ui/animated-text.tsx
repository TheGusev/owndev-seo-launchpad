import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  wordDelay?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  theme?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

const AnimatedText = ({ 
  text, 
  className, 
  wordClassName,
  wordDelay = 100, 
  as: Component = 'span',
  theme = 'primary'
}: AnimatedTextProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const wordElements = container.querySelectorAll('.word-animate');
            wordElements.forEach((word, index) => {
              setTimeout(() => {
                (word as HTMLElement).style.animationPlayState = 'running';
              }, index * wordDelay);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [wordDelay]);

  return (
    <Component ref={containerRef as any} className={cn('inline', className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className={cn(
            'word-animate',
            `word-animate-${theme}`,
            wordClassName
          )}
          style={{ 
            animationDelay: `${index * wordDelay}ms`,
            animationPlayState: 'paused'
          }}
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </Component>
  );
};

export { AnimatedText };
