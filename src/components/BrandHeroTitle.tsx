import { motion } from "framer-motion";

interface BrandHeroTitleProps {
  prefix?: string;
  highlight: string;
  suffix?: string;
  className?: string;
}

const BrandHeroTitle = ({ prefix, highlight, suffix, className = "" }: BrandHeroTitleProps) => {
  return (
    <motion.h1
      className={`text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight font-serif leading-tight text-center ${className}`}
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {prefix && <>{prefix} </>}
      <span className="brand-highlight">{highlight}</span>
      {suffix && <> {suffix}</>}
    </motion.h1>
  );
};

export default BrandHeroTitle;
