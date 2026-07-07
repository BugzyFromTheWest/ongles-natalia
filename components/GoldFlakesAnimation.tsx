"use client";

import { useMemo } from "react";

// Muted champagne-gold palette — warmer and less saturated than pure gold
const GOLD_COLORS = [
  "#F4C56A", "#E8B84B", "#EDD070", "#D4A850", "#F0CF80", "#C89840",
];

// 4-ray soft cross — like light catching a jewel facet.
// Thin ellipse rays that fade at tips feel organic, not geometric.
function ShimmerSVG({ color, size, rotate }: { color: string; size: number; rotate: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <ellipse cx="10" cy="10" rx="1.0" ry="8.5" fill={color} opacity="0.55" />
      <ellipse cx="10" cy="10" rx="8.5" ry="1.0" fill={color} opacity="0.55" />
      <ellipse cx="10" cy="10" rx="0.65" ry="5.0" fill={color} opacity="0.22" transform="rotate(45 10 10)" />
      <ellipse cx="10" cy="10" rx="0.65" ry="5.0" fill={color} opacity="0.22" transform="rotate(-45 10 10)" />
      <circle cx="10" cy="10" r="1.1" fill="rgba(255,252,238,0.80)" />
    </svg>
  );
}

// Tiny blurred speck — gold dust between the larger particles.
function DustSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8"   fill={color} opacity="0.07" />
      <circle cx="10" cy="10" r="3.5" fill={color} opacity="0.20" />
      <circle cx="10" cy="10" r="1.3" fill="rgba(255,250,225,0.72)" />
    </svg>
  );
}

type Props = { count?: number; className?: string; fullWidth?: boolean };

export default function GoldFlakesAnimation({ count = 12, className = "", fullWidth = false }: Props) {
  const flakes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const s1 = ((i + 7) * 1847261341) >>> 0;
      const s2 = ((i + 7) * 3141592653) >>> 0;
      const s3 = ((i + 7) * 2718281827) >>> 0;
      const r = (s: number, min: number, max: number) =>
        min + ((s % 10000) / 10000) * (max - min);
      // Always negative: animation starts already in progress so no particle
      // sits stationary at the top edge waiting for its delay to expire.
      const delay = -(r(s3, 4, 18));
      const isDust = i % 3 === 2;
      return {
        left:     fullWidth ? r(s1, 1, 97) : r(s1, 55, 97),
        size:     isDust ? r(s2, 4, 8) : r(s2, 8, 15),
        delay,
        duration: r(s1 ^ s2, 22, 42),
        opacity:  isDust ? r(s2, 0.25, 0.42) : r(s2, 0.32, 0.58),
        // Static blur on the wrapper — not animated, so no jank.
        blur:     isDust ? r(s3, 0.6, 1.2) : r(s3, 0.2, 0.55),
        // Slight orientation variation makes each shimmer feel unique.
        rotate:   Math.floor(r(s1 ^ s3, 0, 40)),
        isDust,
        color:    GOLD_COLORS[i % GOLD_COLORS.length],
      };
    });
  }, [count, fullWidth]);

  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {flakes.map((f, i) => (
        // Static wrapper: position + base opacity + static blur. Never animates.
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${f.left}%`,
            top: 0,
            opacity: f.opacity,
            filter: `blur(${f.blur.toFixed(2)}px)`,
          }}
        >
          {/* Single animated child — only transform + opacity, no compounding. */}
          <div
            style={{
              willChange: "transform, opacity",
              animation: `goldFlakeDrift ${f.duration}s ${f.delay}s infinite linear`,
            }}
          >
            {f.isDust
              ? <DustSVG color={f.color} size={f.size} />
              : <ShimmerSVG color={f.color} size={f.size} rotate={f.rotate} />
            }
          </div>
        </div>
      ))}
    </div>
  );
}
