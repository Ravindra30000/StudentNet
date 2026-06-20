"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  limit?: number;
  className?: string;
  buttonClassName?: string;
}

export default function ExpandableText({
  text,
  limit = 150,
  className = "text-muted text-sm mt-5 leading-relaxed",
  buttonClassName = "ml-1 inline-block text-xs font-semibold text-accent-green hover:underline focus:outline-none",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > limit;
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, limit)}...` : text;

  return (
    <p className={className}>
      <span className="whitespace-pre-line">{displayText}</span>
      {shouldTruncate && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={buttonClassName}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </p>
  );
}
