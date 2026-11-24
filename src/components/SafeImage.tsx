"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
};

export function SafeImage({
  src,
  alt,
  className = "thumb-media",
  fallbackLabel = "Sin imagen",
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);

  if (!src || failed) {
    return (
      <div className={`${className} media-fallback`} role="img" aria-label={fallbackLabel}>
        <ImageOff size={16} strokeWidth={1.75} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
