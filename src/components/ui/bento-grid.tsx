"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExpandableCard, type ExpandableCardItem } from "./expandable-card";

export interface BentoItem {
  id?: string;
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
  expandedContent?: ReactNode;
  image?: string;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

function BentoGrid({ items, className }: BentoGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Generate IDs for items that don't have them
  const itemsWithIds: ExpandableCardItem[] = items.map((item, index) => ({
    ...item,
    id: item.id || `card-${index}`,
  }));

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",
        className
      )}
      style={{ perspective: 1000 }}
    >
      {itemsWithIds.map((item, index) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className={cn(
            item.colSpan === 2 && "md:col-span-2"
          )}
        >
          <ExpandableCard
            item={item}
            index={index}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export { BentoGrid };
