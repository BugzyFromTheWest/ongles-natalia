"use client";

import { useMemo } from "react";

const GOLD_COLORS = [
  "#e0c48e", "#d4a96a", "#f0d9a8", "#c9a07a", "#e8d4a0", "#d4b87a",
];

function FlakeSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      {/* Diamond shape */}
      <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" fill={color} opacity="0.75" />
      <polygon points="6,2.5 9.5,6 6,9.5 2.5,6" fill={color} opacity="0.35" />
    </svg>
  );
}

type Props = { count?: number; className?: string };

export default function GoldFlakesAnimation({ count = 12, className = "" }: Props) {
  const flakes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // Deterministic pseudo-random — SSR safe
      const s1 = ((i + 7) * 1847261341) >>> 0;
      const s2 = ((i + 7) * 3141592653) >>> 0;
      const s3 = ((i + 7) * 2718281827) >>> 0;
      const r = (s: number, min: number, max: number) =>
        min + ((s % 10000) / 10000) * (max - min);
      return {
        // Right 45% of screen — stays clear of the flower zone on the left
        left: r(s1, 55, 99),
        size: r(s2, 5, 11),
        delay: r(s3, 0, 20),
        duration: r(s1 ^ s2, 14, 28),
        rotateDuration: r(s2 ^ s3, 6, 14),
        color: GOLD_COLORS[i % GOLD_COLORS.length],
      };
    });
  }, [count]);

  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {flakes.map((f, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${f.left}%`,
            top: "-20px",
            animation: `goldFlakeFall ${f.duration}s ${f.delay}s infinite linear`,
            opacity: 0.7,
          }}
        >
          <div
            style={{
              animation: `goldFlakeRotate ${f.rotateDuration}s ${f.delay}s infinite linear`,
            }}
          >
            <FlakeSVG color={f.color} size={f.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
