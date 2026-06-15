import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  withBackground?: boolean;
}

export default function Logo({
  className = "",
  showText = true,
  size = "md",
  withBackground = false,
}: LogoProps) {
  // Sizing definitions mapped to specific heights and widths
  const dimensions = showText
    ? {
        sm: { height: 36, width: 120 },
        md: { height: 48, width: 160 },
        lg: { height: 64, width: 213 },
        xl: { height: 96, width: 320 },
      }[size]
    : {
        sm: { height: 36, width: 36 },
        md: { height: 48, width: 48 },
        lg: { height: 64, width: 64 },
        xl: { height: 96, width: 96 },
      }[size];

  // Specific viewBox to crop to icon bounds if text is hidden
  const viewBox = showText ? "0 0 400 120" : "40 25 60 65";

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox={viewBox}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background card shape if withBackground flag is passed */}
      {withBackground && showText && (
        <rect width="400" height="120" fill="#EFEFED" rx="12" />
      )}

      {/* Network Graph Icon */}
      <g transform="translate(40, 30)">
        <line
          x1="10"
          y1="50"
          x2="30"
          y2="50"
          stroke="#163832"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        <line
          x1="30"
          y1="50"
          x2="50"
          y2="30"
          stroke="#163832"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        <line
          x1="50"
          y1="30"
          x2="30"
          y2="10"
          stroke="#163832"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        <line
          x1="30"
          y1="10"
          x2="10"
          y2="10"
          stroke="#163832"
          strokeWidth="2"
          strokeOpacity="0.4"
        />

        <circle cx="10" cy="50" r="5" fill="#163832" />
        <circle cx="30" cy="50" r="5" fill="#163832" />
        <circle cx="50" cy="30" r="5" fill="#163832" />
        <circle cx="30" cy="10" r="5" fill="#163832" />
        <circle cx="50" cy="10" r="8" fill="#F5B83D" /> {/* Golden highlight node */}
        <circle cx="10" cy="10" r="5" fill="#163832" />
      </g>

      {/* Text Wordmark */}
      {showText && (
        <text
          x="120"
          y="75"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="800"
          fontSize="36"
          letterSpacing="-0.02em"
          fill="#14151A"
        >
          Student
          <tspan fill="#163832">NET</tspan>
        </text>
      )}
    </svg>
  );
}
