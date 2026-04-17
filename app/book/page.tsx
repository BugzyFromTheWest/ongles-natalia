"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  duration_label: string;
};

type SlotDay = {
  date: string;
  times: string[];
  available: number;
};

type Coords = { lat: number; lng: number } | null;


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
  if (s.price === null) return "";
  const prefix = s.price_type === "starting_at" ? (lang === "fr" ? "À partir de " : "From ") : "";
  return `${prefix}$${s.price}`;
}

function BookingInner() {
  const router = useRouter();
  const { t, lang } = useLang();
  const tr = t.book;
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("service") ?? "";

  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<SlotDay[]>([]);
  const [coords, setCoords] = useState<Coords>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    service_id: preselectedId,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce ref for address geocoding
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => {});
  }, []);

  // Fetch slots whenever coords change
  useEffect(() => {
    const url = coords
      ? `/api/slots?lat=${coords.lat}&lng=${coords.lng}`
      : "/api/slots";
    fetch(url)
      .then((r) => r.json())
      .then((data: SlotDay[]) => setSlots(data.slice(0, 5)))
      .catch(() => {});
  }, [coords]);

  // When services load, if we have a preselectedId keep it; otherwise leave as-is
  useEffect(() => {
    if (preselectedId && services.length > 0) {
      const found = services.find((s) => s.id === preselectedId);
      if (found) setForm((f) => ({ ...f, service_id: found.id }));
    }
  }, [services, preselectedId]);

  const selectedService = services.find((s) => s.id === form.service_id) ?? null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === "address") {
      // Clear any pending geocode
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (value.length < 10) { setCoords(null); return; }
      // Debounce geocoding by 700ms
      geocodeTimer.current = setTimeout(async () => {
        setGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1&countrycodes=ca`,
            { headers: { "Accept-Language": "fr,en" } }
          );
          const data = await res.json();
          if (data.length > 0) {
            setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          } else {
            setCoords(null);
          }
        } catch {
          setCoords(null);
        } finally {
          setGeocoding(false);
        }
      }, 700);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const selectedSvc = services.find((s) => s.id === form.service_id);
      const payload = {
        customer_name: form.customer_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        service_requested: selectedSvc
          ? (lang === "fr" ? selectedSvc.french_name : selectedSvc.english_name)
          : form.service_id,
        service_id: form.service_id || null,
        notes: form.notes,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tr.error);
        return;
      }
      router.push(
        `/book/success?name=${encodeURIComponent(data.customer_name)}&date=${data.scheduled_date}&time=${data.scheduled_time}&service=${encodeURIComponent(data.service_requested)}`
      );
    } catch {
      setError(tr.networkError);
    } finally {
      setLoading(false);
    }
  }

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
            <span className="text-white/50 text-[10px] tracking-wider uppercase leading-none">Mobile Nail Studio</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          <a href="/admin/login" className="text-white/60 text-xs hover:text-white transition-colors">
            {tr.adminLogin}
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-[2] px-6 pt-6 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-gold-300 text-xs">✦</span>
          <span className="text-white/80 text-xs tracking-widest uppercase font-medium">{t.appTagline}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
          {tr.title}
        </h1>
        <p className="text-white/60 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          {tr.subtitle}
        </p>
      </div>

      {/* Availability preview */}
      {slots.length > 0 && (
        <div className="relative z-[2] px-4 pb-4 flex justify-center">
          <div className="w-full max-w-lg bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-4">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-3">
              {lang === "fr" ? "Prochaines disponibilités" : "Next Available Dates"}
            </p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => {
                const d = new Date(s.date + "T12:00:00");
                const label = d.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
                  weekday: "short", month: "short", day: "numeric",
                });
                return (
                  <div key={s.date} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                    <span className="text-white text-xs font-medium capitalize">{label}</span>
                    <span className="text-white/50 text-[10px]">·</span>
                    <span className="text-gold-300 text-[10px] font-semibold">
                      {s.available} {lang === "fr" ? (s.available === 1 ? "place" : "places") : (s.available === 1 ? "slot" : "slots")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="relative z-[2] px-4 pb-16 flex justify-center">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
          {/* Gold accent line */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, #FF0080, #f4c56a, #FF0080)" }} />

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3 bg-red-900/40 border border-red-400/40 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                    {tr.fullName} <span style={{ color: "#f4c56a" }}>*</span>
                  </label>
                  <input
                    name="customer_name"
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder:text-white/40"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                    {tr.phone} <span style={{ color: "#f4c56a" }}>*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(514) 555-0000"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder:text-white/40"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                  {tr.email} <span style={{ color: "#f4c56a" }}>*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder:text-white/40"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                  {tr.address} <span style={{ color: "#f4c56a" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    name="address"
                    type="text"
                    required
                    value={form.address}
                    onChange={handleChange}
                    placeholder={lang === "fr" ? "123 Rue Principale, Montréal, QC" : "123 Main St, Montréal, QC"}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder:text-white/40 pr-10"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                  />
                  {geocoding && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-white/60 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                  {!geocoding && coords && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-white/55">
                  {coords
                    ? (lang === "fr" ? "Adresse trouvée — disponibilités mises à jour selon votre secteur" : "Address found — availability updated for your area")
                    : tr.addressHint}
                </p>
              </div>

              {/* Service Selector */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                  {tr.service} <span style={{ color: "#f4c56a" }}>*</span>
                </label>
                <select
                  name="service_id"
                  required
                  value={form.service_id}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-sidebar"
                  style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.5)" }}
                >
                  <option value="">{tr.selectService}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {lang === "fr" ? s.french_name : s.english_name}
                    </option>
                  ))}
                </select>

                {/* Selected service info */}
                {selectedService && (
                  <div className="mt-2 flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(244,197,106,0.15)", border: "1px solid rgba(244,197,106,0.3)" }}>
                    <svg className="w-3.5 h-3.5 text-white/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-white/80">{selectedService.duration_label}</span>
                    {selectedService.price !== null && (
                      <>
                        <span className="text-white/40">·</span>
                        <span className="text-xs font-semibold" style={{ color: "#f4c56a" }}>
                          {formatPrice(selectedService, lang)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                  {tr.notes}
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={tr.notesPlaceholder}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder:text-white/40 resize-none"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #ff3ebf, #ff4fd8)", boxShadow: "0 4px 20px rgba(255,62,191,0.45)" }}
              >
                {loading ? tr.submitting : tr.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense>
      <BookingInner />
    </Suspense>
  );
}
