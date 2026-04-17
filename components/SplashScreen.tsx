"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const GoldFlakesAnimation = dynamic(() => import("@/components/GoldFlakesAnimation"), { ssr: false });

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 900);
    const t2 = setTimeout(() => onDone(), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const dismiss = () => {
    setFading(true);
    setTimeout(onDone, 400);
  };

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: "linear-gradient(135deg, #ff3ebf 0%, #ff4fd8 40%, #ffa8e0 80%, #ffd1ea 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <GoldFlakesAnimation count={28} className="absolute inset-0 z-0" fullWidth />

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 240, height: 240, borderRadius: 32, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/On.png"
            alt="ON! Ongles Natalia"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
