import { useState, useEffect, useRef, RefObject } from "react";

interface UseImageLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseImageLazyLoadReturn {
  ref: RefObject<HTMLDivElement>;
  isInView: boolean;
  isLoaded: boolean;
  hasError: boolean;
  setLoaded: () => void;
  setError: () => void;
}

export const useImageLazyLoad = (
  options: UseImageLazyLoadOptions = {}
): UseImageLazyLoadReturn => {
  const { threshold = 0.1, rootMargin = "100px", triggerOnce = true } = options;
  
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip IntersectionObserver on mobile for instant loading
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref,
    isInView,
    isLoaded,
    hasError,
    setLoaded: () => setIsLoaded(true),
    setError: () => setHasError(true),
  };
};
