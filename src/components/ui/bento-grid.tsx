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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "group relative p-px rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 transition-all duration-300",
            item.colSpan === 2 && "md:col-span-2",
            item.hasPersistentHover && "from-neutral-700 via-neutral-800 to-neutral-700"
          )}
        >
          {/* Hover gradient border glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

          {/* Card content */}
          <div className="relative flex flex-col h-full rounded-xl bg-neutral-950 p-4 transition-transform duration-300 group-hover:translate-y-[-2px]">
            {/* Header with icon and status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 ring-1 ring-white/10">
                {item.icon}
              </div>
              {item.status && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 ring-1 ring-white/10">
                  {item.status}
                </span>
              )}
            </div>

            {/* Title with meta */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-medium text-white text-sm">{item.title}</h3>
                {item.meta && (
                  <span className="text-xs text-neutral-500">{item.meta}</span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Tags and CTA */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/50">
              <div className="flex flex-wrap gap-1.5">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-md bg-transparent ring-1 ring-neutral-800 text-neutral-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.cta || "Explore →"}
              </span>
            </div>

            {/* Subtle hover glow overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
