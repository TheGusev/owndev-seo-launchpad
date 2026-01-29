import React, { useState, useEffect } from 'react';

const MouseGradient = () => {
  const [style, setStyle] = useState({ left: '0px', top: '0px', opacity: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Default true to prevent flash

  useEffect(() => {
    // Check if touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMove = (e: MouseEvent) => {
      setStyle({ left: `${e.clientX}px`, top: `${e.clientY}px`, opacity: 1 });
    };
    const handleLeave = () => setStyle(prev => ({ ...prev, opacity: 0 }));

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [isTouchDevice]);

  // Don't render on touch devices
  if (isTouchDevice) return null;

  return (
    <div
      className="fixed pointer-events-none z-40 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full"
      style={{
        left: style.left,
        top: style.top,
        opacity: style.opacity,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, hsl(174 72% 56% / 0.06), hsl(217 91% 60% / 0.04), transparent 70%)',
        transition: 'left 70ms linear, top 70ms linear, opacity 300ms ease-out',
        filter: 'blur(40px)',
        willChange: 'left, top, opacity',
      }}
    />
  );
};

export { MouseGradient };
