"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ExpandableCardItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  expandedContent?: ReactNode;
  image?: string;
}

interface ExpandableCardProps {
  item: ExpandableCardItem;
  index: number;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const tiltSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
};

export function ExpandableCard({ item, index, selectedId, setSelectedId }: ExpandableCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedId) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setRotate({
      x: y * 12,
      y: -x * 12,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (item.expandedContent) {
      setSelectedId(item.id);
    }
  };

  const isExpanded = selectedId === item.id;

  return (
    <>
      <motion.div
        layoutId={`card-container-${item.id}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1000,
        }}
        className={cn(
          "group relative rounded-xl cursor-pointer",
          item.colSpan === 2 && "md:col-span-2",
          item.expandedContent && "cursor-pointer"
        )}
      >
        <motion.div
          style={{
            rotateX: rotate.x,
            rotateY: rotate.y,
            transformStyle: "preserve-3d",
          }}
          animate={{
            scale: isHovered ? 1.02 : 1,
            y: isHovered ? -8 : 0,
            rotateX: rotate.x,
            rotateY: rotate.y,
          }}
          transition={tiltSpring}
          className="relative p-px rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800"
        >
          {/* Hover gradient border glow */}
          <motion.div 
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 via-blue-500/20 to-cyan-500/30 blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || item.hasPersistentHover ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Card content */}
          <motion.div 
            layoutId={`card-content-${item.id}`}
            className="relative flex flex-col h-full rounded-xl bg-neutral-950 p-4 transition-colors duration-300"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* Background image if provided */}
            {item.image && (
              <div 
                className="absolute inset-0 rounded-xl bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${item.image})` }}
              />
            )}

            {/* Header with icon and status */}
            <motion.div 
              layoutId={`card-header-${item.id}`}
              className="flex items-start justify-between mb-3 relative z-10"
            >
              <motion.div 
                layoutId={`card-icon-${item.id}`}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 ring-1 ring-white/10"
                style={{ transform: "translateZ(20px)" }}
              >
                {item.icon}
              </motion.div>
              {item.status && (
                <motion.span 
                  layoutId={`card-status-${item.id}`}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 ring-1 ring-white/10"
                >
                  {item.status}
                </motion.span>
              )}
            </motion.div>

            {/* Title with meta */}
            <div className="flex-1 space-y-1.5 relative z-10">
              <div className="flex items-baseline gap-2 flex-wrap">
                <motion.h3 
                  layoutId={`card-title-${item.id}`}
                  className="font-medium text-white text-sm"
                  style={{ transform: "translateZ(15px)" }}
                >
                  {item.title}
                </motion.h3>
                {item.meta && (
                  <motion.span 
                    layoutId={`card-meta-${item.id}`}
                    className="text-xs text-neutral-500"
                  >
                    {item.meta}
                  </motion.span>
                )}
              </div>
              <motion.p 
                layoutId={`card-description-${item.id}`}
                className="text-xs text-neutral-400 leading-relaxed line-clamp-2"
              >
                {item.description}
              </motion.p>
            </div>

            {/* Tags and CTA */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/50 relative z-10">
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
              <motion.span 
                className="text-xs text-neutral-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.cta || (item.expandedContent ? "Подробнее →" : "Explore →")}
              </motion.span>
            </div>

            {/* 3D depth shadow */}
            <motion.div 
              className="absolute -bottom-2 left-2 right-2 h-4 rounded-xl bg-black/50 blur-lg -z-10"
              animate={{ 
                opacity: isHovered ? 0.8 : 0,
                scaleX: isHovered ? 0.95 : 0.9,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              onClick={() => setSelectedId(null)}
            />

            {/* Expanded card */}
            <motion.div
              layoutId={`card-container-${item.id}`}
              className="fixed inset-4 md:inset-[10%] lg:inset-[15%] z-50 rounded-2xl overflow-hidden"
              transition={springConfig}
            >
              <motion.div 
                className="relative w-full h-full rounded-2xl bg-neutral-950 border border-neutral-800 overflow-auto"
              >
                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setSelectedId(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 transition-colors ring-1 ring-white/10"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>

                {/* Background image if provided */}
                {item.image && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                )}

                <div className="relative p-6 md:p-8">
                  {/* Header */}
                  <motion.div 
                    layoutId={`card-header-${item.id}`}
                    className="flex items-start gap-4 mb-6"
                  >
                    <motion.div 
                      layoutId={`card-icon-${item.id}`}
                      className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 ring-1 ring-white/10"
                    >
                      {item.icon}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <motion.h2 
                          layoutId={`card-title-${item.id}`}
                          className="text-xl md:text-2xl font-bold text-white"
                        >
                          {item.title}
                        </motion.h2>
                        {item.status && (
                          <motion.span 
                            layoutId={`card-status-${item.id}`}
                            className="text-sm font-medium px-3 py-1 rounded-full bg-neutral-900 text-neutral-400 ring-1 ring-white/10"
                          >
                            {item.status}
                          </motion.span>
                        )}
                      </div>
                      {item.meta && (
                        <motion.span 
                          layoutId={`card-meta-${item.id}`}
                          className="text-sm text-neutral-500 mt-1 block"
                        >
                          {item.meta}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.p 
                    layoutId={`card-description-${item.id}`}
                    className="text-neutral-400 mb-6 text-base leading-relaxed"
                  >
                    {item.description}
                  </motion.p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {item.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="text-sm px-3 py-1 rounded-lg bg-neutral-900 ring-1 ring-neutral-800 text-neutral-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Expanded content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.15 }}
                  >
                    {item.expandedContent}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
