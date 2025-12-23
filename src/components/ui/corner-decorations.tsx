import React from 'react';
import { cn } from '@/lib/utils';

interface CornerDecorationsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CornerDecorations = ({ className, size = 'md' }: CornerDecorationsProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  return (
    <>
      <div 
        className={cn(
          "absolute top-4 left-4 md:top-8 md:left-8 border-l-2 border-t-2 border-primary/30 opacity-0 corner-decoration",
          sizeClasses[size],
          className
        )}
        style={{ animationDelay: '0s' }}
      />
      <div 
        className={cn(
          "absolute top-4 right-4 md:top-8 md:right-8 border-r-2 border-t-2 border-primary/30 opacity-0 corner-decoration",
          sizeClasses[size],
          className
        )}
        style={{ animationDelay: '0.2s' }}
      />
      <div 
        className={cn(
          "absolute bottom-4 left-4 md:bottom-8 md:left-8 border-l-2 border-b-2 border-primary/30 opacity-0 corner-decoration",
          sizeClasses[size],
          className
        )}
        style={{ animationDelay: '0.4s' }}
      />
      <div 
        className={cn(
          "absolute bottom-4 right-4 md:bottom-8 md:right-8 border-r-2 border-b-2 border-primary/30 opacity-0 corner-decoration",
          sizeClasses[size],
          className
        )}
        style={{ animationDelay: '0.6s' }}
      />
    </>
  );
};

export { CornerDecorations };
