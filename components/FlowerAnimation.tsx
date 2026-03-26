"use client";

import { useMemo } from "react";

const COLORS = [
  "#f9c8dc", "#f499be", "#fce4ee", "#f9c8dc",
  "#eb6b9d", "#e0c48e", "#fdf2f7", "#f9c8dc",
];

function FlowerSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="20" cy="10" rx="5.5" ry="9"
          fill={color}
          opacity="0.9"
          transform={`rotate(${a} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4.5" fill="#fdf2f7" opacity="0.95" />
      <circle cx="20" cy="20" r="2.5" fill={color} opacity="0.7" />
    </svg>
  );
}

type Props = { count?: number; className?: string };

export default function FlowerAnimation({ count = 18, className = "" }: Props) {
  const flowers = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // Deterministic pseudo-random so SSR and client match
      const s1 = ((i + 1) * 2654435761) >>> 0;
      const s2 = ((i + 1) * 1234567891) >>> 0;
      const s3 = ((i + 1) * 987654321) >>> 0;
      const r = (s: number, min: number, max: number) =>
        min + ((s % 10000) / 10000) * (max - min);
      return {
        left: r(s1, 1, 99),
        size: r(s2, 10, 22),
        delay: r(s3, 0, 16),
        duration: r(s1 ^ s2, 10, 22),
        swayDuration: r(s2 ^ s3, 4, 8),
        color: COLORS[i % COLORS.length],
      };
    });
  }, [count]);

  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {flowers.map((f, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${f.left}%`,
            top: "-30px",
            animation: `flowerFall ${f.duration}s ${f.delay}s infinite linear`,
          }}
        >
          <div
            style={{
              animation: `flowerSway ${f.swayDuration}s ${f.delay}s infinite ease-in-out alternate`,
            }}
          >
            <FlowerSVG color={f.color} size={f.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
