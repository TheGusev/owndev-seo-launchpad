import { useState } from "react";

interface SiteBadgeProps {
  domain: string;
  brandName: string;
  size?: number;
}

const SiteBadge = ({ domain, brandName, size = 28 }: SiteBadgeProps) => {
  const [imgError, setImgError] = useState(false);
  const monogram = brandName.charAt(0).toUpperCase();

  return (
    <div
      className="shrink-0 rounded-md bg-muted/50 border border-border/20 flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt={brandName}
          width={size - 6}
          height={size - 6}
          className="object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span
          className="text-xs font-bold text-muted-foreground select-none"
          style={{ fontSize: size * 0.4 }}
        >
          {monogram}
        </span>
      )}
    </div>
  );
};

export default SiteBadge;
