"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const GoldFlakesAnimation = dynamic(() => import("@/components/GoldFlakesAnimation"), { ssr: false });

type Service = {
  id: string;
  category: string;
  french_name: string;
  english_name: string;
  price_type: "fixed" | "starting_at" | "variable";
  price: number | null;
  duration_minutes: number;
  duration_label: string;
  description_fr: string;
  description_en: string;
};

const CATEGORY_ORDER = ["manicure", "pedicure", "extensions", "nail_art", "courses", "repairs"];

const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  manicure:   { fr: "Manucure",    en: "Manicure" },
  pedicure:   { fr: "Pédicure",    en: "Pedicure" },
  extensions: { fr: "Extensions",  en: "Extensions" },
  nail_art:   { fr: "Nail Art",    en: "Nail Art" },
  courses:    { fr: "Cours",       en: "Courses" },
  repairs:    { fr: "Réparations", en: "Repairs" },
};

function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold text-white/80 hover:text-white hover:border-white/60 transition-colors tracking-wider"
    >
      <span className={lang === "fr" ? "opacity-100" : "opacity-40"}>FR</span>
      <span className="opacity-30 mx-0.5">·</span>
      <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
    </button>
  );
}

function formatPrice(s: Service, lang: "en" | "fr") {
  if (s.price_type === "variable") return lang === "fr" ? "Voir avec technicienne" : "Ask technician";
  if (s.price === null) return "—";
  const prefix = s.price_type === "starting_at" ? (lang === "fr" ? "À partir de " : "From ") : "";
  return `${prefix}$${s.price}`;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #ff3ebf 0%, #ff4fd8 40%, #ffa8e0 80%, #ffd1ea 100%)";

function ServicesInner() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category") ?? "manicure";

  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState(initialCat);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const grouped = CATEGORY_ORDER.reduce<Record<string, Service[]>>((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat);
    return acc;
  }, {});

  const visibleCats = CATEGORY_ORDER.filter((c) => grouped[c].length > 0);
  const currentServices = grouped[activeTab] ?? [];

  return (
    <div className="relative min-h-screen">
      <GoldFlakesAnimation count={20} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />

      {/* Header */}
      <header className="relative z-[2] px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/On.png" alt="ON!" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div>
            <span className="text-white font-semibold text-base leading-none block">Ongles Natalia</span>
            <span className="text-white/50 text-[10px] tracking-wider uppercase leading-none">
              {lang === "fr" ? "Nos services" : "Our services"}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link
            href="/book"
            className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg"
            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            {lang === "fr" ? "Réserver" : "Book Now"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-[2] px-6 pt-2 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
          {lang === "fr" ? "Nos Services" : "Our Services"}
        </h1>
        <p className="text-white/65 text-sm max-w-sm mx-auto">
          {lang === "fr"
            ? "Des soins experts pour sublimer vos ongles — à domicile ou au studio."
            : "Expert nail care to elevate your look — at home or at the studio."}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="relative z-[2] px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap">
          {visibleCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={
                activeTab === cat
                  ? { background: "rgba(255,255,255,0.95)", color: "#d0245c", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }
                  : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)" }
              }
            >
              {CATEGORY_LABELS[cat]?.[lang] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards */}
      <div className="relative z-[2] px-4 pb-16 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center text-white/50 py-16">
            {lang === "fr" ? "Chargement…" : "Loading…"}
          </div>
        ) : currentServices.length === 0 ? (
          <div className="text-center text-white/50 py-16">
            {lang === "fr" ? "Aucun service disponible" : "No services available"}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {currentServices.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-5 transition-all"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-white text-base leading-snug">
                    {lang === "fr" ? s.french_name : s.english_name}
                  </h3>
                  <span className="shrink-0 font-bold text-sm text-right" style={{ color: "#FFD700" }}>
                    {formatPrice(s, lang)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-3.5 h-3.5 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/70 text-xs">{s.duration_label}</span>
                </div>

                {(lang === "fr" ? s.description_fr : s.description_en) ? (
                  <p className="text-white/65 text-xs mb-4 leading-relaxed">
                    {lang === "fr" ? s.description_fr : s.description_en}
                  </p>
                ) : null}

                <Link
                  href={`/book?service=${s.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)" }}
                >
                  ✦ {lang === "fr" ? "Réserver" : "Book"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to home */}
      <div className="relative z-[2] text-center pb-8">
        <Link href="/" className="text-white/50 text-xs hover:text-white/80 transition-colors">
          ← {lang === "fr" ? "Retour à l'accueil" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesInner />
    </Suspense>
  );
}
