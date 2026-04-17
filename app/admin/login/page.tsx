"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const GoldFlakesAnimation = dynamic(() => import("@/components/GoldFlakesAnimation"), { ssr: false });

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <GoldFlakesAnimation count={18} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />
      {/* Lang toggle top-right */}
      <div className="fixed top-4 right-4">
        <button
          onClick={toggle}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold text-white/70 hover:text-white hover:border-white/60 transition-colors tracking-wider"
        >
          <span className={lang === "fr" ? "opacity-100" : "opacity-40"}>FR</span>
          <span className="opacity-30 mx-0.5">·</span>
          <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
        </button>
      </div>

      <div className="relative z-[2] w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <div className="h-1" style={{ background: "linear-gradient(90deg, #FF0080, #f4c56a, #FF0080)" }} />
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,197,106,0.25)", border: "1px solid rgba(244,197,106,0.5)" }}>
              <SparkleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm block leading-none">{t.appName}</span>
              <span className="text-[10px] tracking-wider uppercase leading-none" style={{ color: "#f4c56a" }}>Admin</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white mb-1">{tr.title}</h1>
          <p className="text-sm text-white/60 mb-6">{tr.subtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-400/40 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                {tr.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                {tr.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all mt-2"
              style={{ background: "linear-gradient(135deg, #ff3ebf, #ff4fd8)", boxShadow: "0 4px 20px rgba(255,62,191,0.45)" }}
            >
              {loading ? tr.submitting : tr.submit}
            </button>
          </form>

          <p className="mt-6 text-xs text-white/40 text-center">{tr.defaultHint}</p>
        </div>
      </div>
    </div>
  );
}
