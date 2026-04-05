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
      className={`text-[clamp(2rem,7vw,4.5rem)] font-bold font-serif leading-[1.1] tracking-tight text-center hero-title-animate ${className}`}
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {prefix && <>{prefix} </>}
      <span className="brand-highlight">{highlight}</span>
      {suffix && <>{suffix}</>}
    </motion.h1>
  );
};

export default BrandHeroTitle;
