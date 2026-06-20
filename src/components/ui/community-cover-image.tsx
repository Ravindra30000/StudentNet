"use client";

import { useState } from "react";

interface CommunityCoverImageProps {
  coverImageUrl: string | null | undefined;
  name: string;
  className?: string;
  gradientClass: string;
  overlay?: React.ReactNode;
}

export default function CommunityCoverImage({
  coverImageUrl,
  name,
  className = "h-24 w-full object-cover",
  gradientClass,
  overlay,
}: CommunityCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !coverImageUrl) {
    return <div className={gradientClass} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImageUrl}
        alt={name}
        className={className}
        onError={() => setHasError(true)}
      />
      {!hasError && overlay}
    </>
  );
}
