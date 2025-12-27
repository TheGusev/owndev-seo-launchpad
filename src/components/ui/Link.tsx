import { forwardRef, type AnchorHTMLAttributes } from "react";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "default" | "muted" | "accent";
  ariaLabel?: string;
  external?: boolean;
}

const variantStyles: Record<"default" | "muted" | "accent", string> = {
  default: "text-foreground hover:text-accent",
  muted: "text-muted-foreground hover:text-foreground",
  accent: "text-accent hover:text-accent-hover",
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ variant = "default", ariaLabel, external = false, className = "", children, href, ...props }, ref) => {
    const externalProps = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    return (
      <a
        ref={ref}
        href={href}
        aria-label={ariaLabel}
        className={`
          inline-flex items-center gap-1
          font-medium
          transition-colors duration-200
          focus-ring rounded
          ${variantStyles[variant]}
          ${className}
        `}
        {...externalProps}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";

export { Link, type LinkProps };
