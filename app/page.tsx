"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const FlowerAnimation = dynamic(() => import("@/components/FlowerAnimation"), { ssr: false });

type Service = {
  id: string; category: string; french_name: string; english_name: string;
  price_type: string; price: number | null; duration_label: string;
};
type Business = {
  name: string; address: string; phone: string; email: string;
  instagram: string; gift_card_url: string; hours: string;
};

function fmtPrice(price: number | null, type: string, lang: string) {
  if (type === "variable") return lang === "fr" ? "Prix variable" : "Variable price";
  if (price === null) return "—";
  const p = `$${price % 1 === 0 ? price : price.toFixed(2)}`;
  return type === "starting_at" ? `${p}+` : p;
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" />
      <path d="M19 3l.7 1.9 1.9.7-1.9.7L19 8l-.7-1.8L16.4 5.5l1.9-.7z" opacity=".6" />
      <path d="M5 17l.6 1.5 1.5.6-1.5.6L5 21.2l-.6-1.5L2.9 19l1.5-.6z" opacity=".45" />
    </svg>
  );
}

function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold text-white/80 hover:text-white hover:border-white/60 transition-colors tracking-wider">
      <span className={lang === "fr" ? "opacity-100" : "opacity-40"}>FR</span>
      <span className="opacity-25 mx-0.5">·</span>
      <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
    </button>
  );
}

const FEATURED_CATEGORIES = ["manicure", "pedicure", "extensions", "nail_art"];

export default function HomePage() {
  const { lang } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(setServices);
    fetch("/api/business").then(r => r.json()).then(setBusiness);
  }, []);

  const featured = FEATURED_CATEGORIES.map(cat =>
    services.find(s => s.category === cat)
  ).filter(Boolean) as Service[];

  const hours: Record<string, string> = business?.hours ? JSON.parse(business.hours) : {};
  const DAY_NAMES_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_FULL_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const DAY_FULL_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(160deg, #7b2d55 0%, #4a1835 55%, #2a1020 100%)" }}
      >
        <FlowerAnimation count={22} className="absolute inset-0 z-0" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <SparkleIcon className="w-5 h-5 text-gold-300" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-tight">Ongles Natalia</span>
              <span className="text-white/40 text-[9px] tracking-widest uppercase">Mobile Nail Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link href="/services" className="hidden sm:block text-white/70 text-sm hover:text-white transition-colors">
              {lang === "fr" ? "Nos services" : "Our services"}
            </Link>
            <Link href="/book" className="bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              {lang === "fr" ? "Réserver" : "Book"}
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <SparkleIcon className="w-3 h-3 text-gold-300" />
            <span className="text-white/70 text-[10px] tracking-[0.2em] uppercase font-medium">
              {lang === "fr" ? "Service de manucure mobile · Montréal" : "Mobile nail service · Montréal"}
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight leading-none">
            Ongles<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #f9c8dc, #e0c48e, #f499be)" }}>
              Natalia
            </span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg max-w-sm mt-4 mb-10 leading-relaxed">
            {lang === "fr"
              ? "Votre spécialiste en manucure mobile à domicile."
              : "Your mobile nail specialist, coming to you."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/book"
              className="px-8 py-4 rounded-2xl font-bold text-white text-sm tracking-wide transition-all shadow-xl shadow-brand-900/40"
              style={{ background: "linear-gradient(135deg, #c17a8f, #b83059)" }}
            >
              {lang === "fr" ? "✦ Réserver maintenant" : "✦ Book now"}
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 rounded-2xl font-semibold text-white/80 text-sm border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur transition-all"
            >
              {lang === "fr" ? "Voir nos services" : "View services"}
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce opacity-40">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── FEATURED SERVICES ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] text-brand-400 font-semibold tracking-[0.25em] uppercase mb-2">
              {lang === "fr" ? "Ce que nous offrons" : "What we offer"}
            </p>
            <h2 className="text-3xl font-bold text-sidebar">
              {lang === "fr" ? "Nos soins vedettes" : "Featured services"}
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-300 to-gold-400 mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {featured.map((s) => (
              <Link
                key={s.id}
                href={`/book?service=${s.id}`}
                className="group bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-brand-100"
              >
                <div className="w-9 h-9 bg-white rounded-xl border border-brand-100 flex items-center justify-center mb-4 group-hover:border-brand-200 transition-colors">
                  <SparkleIcon className="w-4 h-4 text-brand-400" />
                </div>
                <h3 className="font-bold text-sidebar text-sm mb-0.5">
                  {lang === "fr" ? s.french_name : s.english_name}
                </h3>
                {lang === "fr" && s.english_name !== s.french_name && (
                  <p className="text-xs text-brand-300 mb-2">{s.english_name}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-brand-600 font-bold text-sm">{fmtPrice(s.price, s.price_type, lang)}</span>
                  <span className="text-brand-300 text-xs">· {s.duration_label}</span>
                </div>
                <div className="mt-3 text-[10px] font-semibold text-brand-400 group-hover:text-brand-600 transition-colors tracking-wide uppercase">
                  {lang === "fr" ? "Réserver →" : "Book →"}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-200 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm"
            >
              {lang === "fr" ? "Voir tous les services" : "View all services"}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── GIFT CARDS ────────────────────────────────────────────────── */}
      <section
        className="relative px-6 py-14 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7b2d55 0%, #4a1835 100%)" }}
      >
        <FlowerAnimation count={10} className="absolute inset-0 z-0 opacity-40" />
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <div className="text-3xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {lang === "fr" ? "Offrez l'expérience Ongles Natalia" : "Give the Ongles Natalia experience"}
          </h2>
          <p className="text-white/60 text-sm mb-7 leading-relaxed">
            {lang === "fr"
              ? "La carte-cadeau parfaite pour gâter une personne spéciale."
              : "The perfect gift card to treat someone special."}
          </p>
          {business?.gift_card_url ? (
            <a
              href={business.gift_card_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 bg-white text-sidebar font-bold rounded-xl hover:bg-brand-50 transition-colors text-sm shadow-xl"
            >
              {lang === "fr" ? "Acheter une carte-cadeau" : "Buy a gift card"}
            </a>
          ) : (
            <a
              href={`mailto:${business?.email ?? "onglesnatalia@gmail.com"}`}
              className="inline-block px-8 py-3.5 bg-white text-sidebar font-bold rounded-xl hover:bg-brand-50 transition-colors text-sm shadow-xl"
            >
              {lang === "fr" ? "Nous contacter pour une carte-cadeau" : "Contact us for a gift card"}
            </a>
          )}
        </div>
      </section>

      {/* ── CONTACT + HOURS ───────────────────────────────────────────── */}
      <section className="bg-cream px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] text-brand-400 font-semibold tracking-[0.25em] uppercase mb-2">
              {lang === "fr" ? "Nous joindre" : "Get in touch"}
            </p>
            <h2 className="text-3xl font-bold text-sidebar">
              {lang === "fr" ? "Contact & Horaires" : "Contact & Hours"}
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-300 to-gold-400 mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact */}
            <div className="bg-white rounded-2xl p-6 border border-brand-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sidebar mb-4">{lang === "fr" ? "Nous contacter" : "Contact us"}</h3>
              {[
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ),
                  label: business?.address ?? "6362 Alexis-Contant, Montréal, QC, H1M 1E9",
                  href: `https://maps.google.com/?q=${encodeURIComponent(business?.address ?? "6362 Alexis-Contant Montreal")}`,
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  ),
                  label: business?.phone ?? "+1 514-652-6284",
                  href: `tel:${business?.phone ?? "+15146526284"}`,
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  ),
                  label: business?.email ?? "onglesnatalia@gmail.com",
                  href: `mailto:${business?.email ?? "onglesnatalia@gmail.com"}`,
                },
              ].map((item, i) => (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm text-slate-600 hover:text-brand-600 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-brand-500 group-hover:bg-brand-200 transition-colors mt-0.5">
                    {item.icon}
                  </div>
                  {item.label}
                </a>
              ))}

              {/* Instagram */}
              {business?.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-600 hover:text-brand-600 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 text-brand-500 group-hover:bg-brand-200 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  Instagram — @onglesnatalia
                </a>
              )}
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl p-6 border border-brand-100 shadow-sm">
              <h3 className="font-bold text-sidebar mb-4">{lang === "fr" ? "Heures d'ouverture" : "Business hours"}</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const h = hours[String(day)];
                  const isClosed = !h || h.toLowerCase().includes("ferm") || h.toLowerCase().includes("closed");
                  const today = new Date().getDay();
                  return (
                    <div key={day} className={`flex justify-between items-center text-sm py-1.5 border-b border-brand-50 last:border-0 ${today === day ? "font-bold text-brand-600" : "text-slate-600"}`}>
                      <span>{lang === "fr" ? DAY_FULL_FR[day] : DAY_FULL_EN[day]}</span>
                      <span className={isClosed ? "text-brand-300" : ""}>
                        {h ?? (lang === "fr" ? "Fermé" : "Closed")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all shadow-lg shadow-brand-300/30"
              style={{ background: "linear-gradient(135deg, #c17a8f, #b83059)" }}
            >
              <SparkleIcon className="w-4 h-4" />
              {lang === "fr" ? "Prendre un rendez-vous" : "Book an appointment"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-sidebar text-white/50 px-6 py-8 text-center text-xs space-y-1">
        <div className="flex items-center justify-center gap-2 mb-3">
          <SparkleIcon className="w-4 h-4 text-brand-300" />
          <span className="text-white font-semibold text-sm">Ongles Natalia</span>
          <SparkleIcon className="w-4 h-4 text-brand-300" />
        </div>
        <p>{business?.address ?? "6362 Alexis-Contant, Montréal, QC, H1M 1E9"}</p>
        <p>{business?.phone ?? "+1 514-652-6284"} · {business?.email ?? "onglesnatalia@gmail.com"}</p>
        <p className="pt-2 text-white/25">© {new Date().getFullYear()} Ongles Natalia. {lang === "fr" ? "Tous droits réservés." : "All rights reserved."}</p>
      </footer>
    </div>
  );
}
