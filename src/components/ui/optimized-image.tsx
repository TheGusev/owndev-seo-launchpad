import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useImageLazyLoad } from "@/hooks/use-image-lazy-load";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: "blur" | "shimmer" | "solid";
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  placeholder = "shimmer",
  priority = false,
  className,
  containerClassName,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const { ref, isInView, isLoaded, hasError, setLoaded, setError } = useImageLazyLoad({
    rootMargin: "200px",
    triggerOnce: true,
  });

  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (isInView || priority) {
      setShouldLoad(true);
    }
  }, [isInView, priority]);

  const handleLoad = () => {
    setLoaded();
    onLoad?.();
  };

  const handleError = () => {
    setError();
    onError?.();
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            placeholder === "shimmer" && "image-shimmer",
            placeholder === "solid" && "bg-muted",
            placeholder === "blur" && "bg-muted backdrop-blur-sm",
            isLoaded && "opacity-0"
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Ошибка загрузки
        </div>
      )}

      {/* Image */}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
            className
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
