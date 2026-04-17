"use client";

import { useMemo } from "react";

const GOLD_COLORS = [
  "#FFD700", "#FFC107", "#FFAA00", "#FFE566", "#F4C56A", "#FFA500",
];

function FlakeSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      {/* Outer glow halo */}
      <circle cx="10" cy="10" r="9" fill={color} opacity="0.12" />
      {/* 4-point starburst */}
      <polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill={color} opacity="1" />
      {/* Bright white-gold center */}
      <circle cx="10" cy="10" r="2.8" fill="rgba(255,255,255,0.98)" />
      {/* Inner gold shimmer ring */}
      <circle cx="10" cy="10" r="5" fill="none" stroke={color} strokeWidth="1" opacity="0.7" />
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
      return {
        left: fullWidth ? r(s1, 1, 97) : r(s1, 55, 97),
        size: r(s2, 16, 34),
        delay: r(s3, 0, 20),
        duration: r(s1 ^ s2, 14, 28),
        rotateDuration: r(s2 ^ s3, 5, 12),
        swayDuration: r(s1 ^ s3, 4, 9),
        twinkleDuration: r(s2 ^ s1, 1.5, 3.2),
        glowDuration: r(s3 ^ s1, 1.8, 3.5),
        opacity: r(s2, 0.88, 1.0),
        color: GOLD_COLORS[i % GOLD_COLORS.length],
      };
    });
  }, [count, fullWidth]);

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
            top: "-34px",
            animation: `goldFlakeFall ${f.duration}s ${f.delay}s infinite ease-in-out`,
            opacity: f.opacity,
            willChange: "transform, opacity",
          }}
        >
          <div style={{ animation: `goldFlakeSway ${f.swayDuration}s ${f.delay}s infinite ease-in-out` }}>
            <div style={{ animation: `goldFlakeRotate ${f.rotateDuration}s ${f.delay}s infinite linear` }}>
              <div style={{ animation: `goldFlakeTwinkle ${f.twinkleDuration}s ${f.delay}s infinite ease-in-out, goldFlakeGlow ${f.glowDuration}s ${f.delay}s infinite ease-in-out` }}>
                <FlakeSVG color={f.color} size={f.size} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
