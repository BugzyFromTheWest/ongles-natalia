"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const GoldFlakesAnimation = dynamic(() => import("@/components/GoldFlakesAnimation"), { ssr: false });

function SparkleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, toggle } = useLang();
  const tr = t.login;

  const [email, setEmail] = useState("admin@scheduler.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? tr.failed);
        return;
      }
      router.push("/admin");
    } catch {
      setError(tr.networkError);
    } finally {
      setLoading(false);
    }
  }

  const LABEL: React.CSSProperties = {
    color: "rgba(255,255,255,0.90)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  };
  const INPUT: React.CSSProperties = {
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.26)",
    color: "#ffffff",
    fontSize: 16,
    WebkitTextFillColor: "#ffffff",
    width: "100%",
    borderRadius: 12,
    padding: "12px 16px",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative" style={{ paddingBottom: "12vh" }}>
      <GoldFlakesAnimation count={5} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />

      {/* Lang toggle */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={toggle}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold text-white/80 hover:text-white hover:border-white/60 transition-colors tracking-wider"
        >
          <span className={lang === "fr" ? "opacity-100" : "opacity-40"}>FR</span>
          <span className="opacity-30 mx-0.5">·</span>
          <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
        </button>
      </div>

      {/* Dark glass card */}
      <div
        className="relative z-[2] w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "rgba(8, 1, 6, 0.88)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.09)",
        }}
      >
        {/* Shimmer top line */}
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #7a0a48 15%, #f4c56a 50%, #7a0a48 85%, transparent)" }} />

        <div className="p-7">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(244,197,106,0.16)", border: "1px solid rgba(244,197,106,0.35)" }}>
              <SparkleIcon className="w-5 h-5" style={{ color: "#f4c56a" }} />
            </div>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Ongles Natalia</span>
              <span className="text-[10px] tracking-widest uppercase" style={{ color: "#f4c56a" }}>Admin</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white mb-1">{tr.title}</h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>{tr.subtitle}</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(160,16,16,0.40)", border: "1px solid rgba(255,90,90,0.30)", color: "#ffb3b3" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={LABEL}>{tr.email}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@onglesnatalia.ca"
                className="focus:outline-none placeholder:text-white/25"
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>{tr.password}</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:outline-none"
                style={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full disabled:opacity-50 font-bold py-3.5 rounded-xl text-sm mt-1"
              style={{
                background: "linear-gradient(135deg, #c8207a 0%, #a01060 55%, #7a0a48 100%)",
                color: "#ffffff",
                boxShadow: "0 3px 14px rgba(160,16,96,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {loading ? tr.submitting : tr.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
