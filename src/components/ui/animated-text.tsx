import React, { useEffect, useRef, useState } from 'react';
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
  wordDelay = 80, 
  as: Component = 'span',
  theme = 'primary'
}: AnimatedTextProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <Component ref={containerRef as any} className={cn('inline', className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className={cn(
            isVisible ? 'word-animate' : 'opacity-0',
            `word-animate-${theme}`,
            wordClassName
          )}
          style={{ 
            animationDelay: isVisible ? `${index * wordDelay}ms` : '0ms'
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
