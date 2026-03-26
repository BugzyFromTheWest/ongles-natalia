"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #7b2d55 0%, #4a1835 60%, #2a1020 100%)" }}
    >
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

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-400 via-gold-400 to-brand-300" />
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <SparkleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sidebar text-sm block leading-none">{t.appName}</span>
              <span className="text-[10px] text-brand-400 tracking-wider uppercase leading-none">Admin</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-sidebar mb-1">{tr.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{tr.subtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                {tr.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-brand-50/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                {tr.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-brand-50/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-300/30 mt-2"
            >
              {loading ? tr.submitting : tr.submit}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">{tr.defaultHint}</p>
        </div>
      </div>
    </div>
  );
}
