"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  variant?: "problem" | "solution" | "default";
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {items.map((item, index) => {
        const isProblem = item.variant === "problem";
        const isSolution = item.variant === "solution";
        
        return (
          <div
            key={index}
            className={cn(
              "group relative p-1 rounded-xl overflow-hidden transition-all duration-500",
              item.colSpan === 2 && "md:col-span-2",
              item.hasPersistentHover && "shadow-lg"
            )}
          >
            {/* Gradient border effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500",
                isProblem && "bg-gradient-to-br from-destructive/40 via-destructive/20 to-transparent",
                isSolution && "bg-gradient-to-br from-success/40 via-success/20 to-transparent",
                !isProblem && !isSolution && "bg-gradient-to-br from-primary/40 via-primary/20 to-transparent"
              )}
            />

            {/* Card content */}
            <div
              className={cn(
                "relative flex flex-col h-full rounded-xl p-5 transition-all duration-300",
                "bg-background/80 backdrop-blur-sm border",
                isProblem && "border-destructive/30 hover:border-destructive/50",
                isSolution && "border-success/30 hover:border-success/50",
                !isProblem && !isSolution && "border-border/50 hover:border-primary/50",
                "group-hover:translate-y-[-2px] group-hover:shadow-xl"
              )}
            >
              {/* Header with icon and status */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    isProblem && "bg-destructive/10",
                    isSolution && "bg-success/10",
                    !isProblem && !isSolution && "bg-primary/10"
                  )}
                >
                  {item.icon}
                </div>
                {item.status && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      isProblem && "bg-destructive/10 text-destructive",
                      isSolution && "bg-success/10 text-success",
                      !isProblem && !isSolution && "bg-primary/10 text-primary"
                    )}
                  >
                    {item.status}
                  </span>
                )}
              </div>

              {/* Title and description */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      "font-semibold text-foreground group-hover:transition-colors duration-300",
                      isProblem && "group-hover:text-destructive",
                      isSolution && "group-hover:text-success",
                      !isProblem && !isSolution && "group-hover:text-primary"
                    )}
                  >
                    {item.title}
                  </h3>
                  {item.meta && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.meta}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Tags and CTA */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <div className="flex flex-wrap gap-2">
                  {item.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md",
                        isProblem && "bg-destructive/5 text-destructive/70",
                        isSolution && "bg-success/5 text-success/70",
                        !isProblem && !isSolution && "bg-primary/5 text-primary/70"
                      )}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                {item.cta && (
                  <span
                    className={cn(
                      "text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      isProblem && "text-destructive",
                      isSolution && "text-success",
                      !isProblem && !isSolution && "text-primary"
                    )}
                  >
                    {item.cta}
                  </span>
                )}
              </div>

              {/* Subtle hover glow */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  isProblem && "bg-gradient-to-t from-destructive/5 to-transparent",
                  isSolution && "bg-gradient-to-t from-success/5 to-transparent",
                  !isProblem && !isSolution && "bg-gradient-to-t from-primary/5 to-transparent"
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { BentoGrid };
