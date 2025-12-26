import { useState, useEffect } from "react";

export const useTouchDevice = (): boolean => {
  // Initialize with SSR-safe check to avoid flash on mobile
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(hover: none)").matches
    );
  });

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(hover: none)").matches
      );
    };
    
    // Recheck on resize in case of device mode changes
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  return isTouchDevice;
};

// Static check for SSR-safe usage
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(hover: none)").matches
  );
};
