"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import FlowerAnimation from "@/components/FlowerAnimation";

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
  manicure:   { fr: "Manucure",         en: "Manicure" },
  pedicure:   { fr: "Pédicure",         en: "Pedicure" },
  extensions: { fr: "Extensions",       en: "Extensions" },
  nail_art:   { fr: "Nail Art",         en: "Nail Art" },
  courses:    { fr: "Cours",            en: "Courses" },
  repairs:    { fr: "Réparations",      en: "Repairs" },
};

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" />
      <path d="M19 2l.9 2.1L22 5l-2.1.9L19 8l-.9-2.1L16 5l2.1-.9z" opacity=".6" />
      <path d="M5 16l.7 1.6 1.6.7-1.6.7L5 20.6l-.7-1.6L2.7 18.3l1.6-.7z" opacity=".5" />
    </svg>
  );
}

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

function ServicesInner() {
  const { lang, toggle } = useLang();
  const router = useRouter();
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
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #7b2d55 0%, #4a1835 50%, #2a1020 100%)" }}>
      {/* Flowers */}
      <FlowerAnimation count={16} className="fixed inset-0 z-0" />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <SparkleIcon className="w-5 h-5 text-gold-300" />
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
            className="px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-lg"
          >
            {lang === "fr" ? "Réserver" : "Book Now"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 px-6 pt-4 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
          {lang === "fr" ? "Nos Services" : "Our Services"}
        </h1>
        <p className="text-white/60 text-sm max-w-sm mx-auto">
          {lang === "fr"
            ? "Des soins experts pour sublimer vos ongles — à domicile ou au studio."
            : "Expert nail care to elevate your look — at home or at the studio."}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="relative z-10 px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center flex-wrap">
          {visibleCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === cat
                  ? "bg-brand-500 text-white border-brand-400 shadow-lg shadow-brand-500/30"
                  : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white"
              }`}
            >
              {CATEGORY_LABELS[cat]?.[lang] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards */}
      <div className="relative z-10 px-4 pb-16 max-w-4xl mx-auto">
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
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-white font-semibold text-base leading-snug">
                    {lang === "fr" ? s.french_name : s.english_name}
                  </h3>
                  <span className="shrink-0 text-gold-300 font-bold text-sm text-right">
                    {formatPrice(s, lang)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/60 text-xs">{s.duration_label}</span>
                </div>

                {(lang === "fr" ? s.description_fr : s.description_en) ? (
                  <p className="text-white/50 text-xs mb-4 leading-relaxed">
                    {lang === "fr" ? s.description_fr : s.description_en}
                  </p>
                ) : null}

                <Link
                  href={`/book?service=${s.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/80 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40"
                >
                  <SparkleIcon className="w-3 h-3" />
                  {lang === "fr" ? "Réserver" : "Book"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to home */}
      <div className="relative z-10 text-center pb-8">
        <Link href="/" className="text-white/40 text-xs hover:text-white/70 transition-colors">
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
