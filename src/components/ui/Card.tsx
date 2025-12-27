import { forwardRef, type HTMLAttributes, useId } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "div" | "section";
  glass?: boolean;
  hover?: boolean;
  title?: string;
}

const Card = forwardRef<HTMLElement, CardProps>(
  ({ as: Component = "article", glass = true, hover = true, title, className = "", children, ...props }, ref) => {
    const titleId = useId();

    return (
      <Component
        ref={ref as any}
        role="article"
        aria-labelledby={title ? titleId : undefined}
        className={`
          rounded-xl p-6
          ${glass ? "glass" : "bg-card border border-border"}
          ${hover ? "glass-hover" : ""}
          ${className}
        `}
        {...props}
      >
        {title && (
          <h3 id={titleId} className="text-xl font-semibold text-foreground mb-3">
            {title}
          </h3>
        )}
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

export { Card, type CardProps };
