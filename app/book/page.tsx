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

const TRUST_ITEMS = {
  fr: [
    { icon: "📍", text: "Service mobile partout à Montréal" },
    { icon: "💅", text: "Soins professionnels à domicile" },
    { icon: "📅", text: "Rendez-vous flexibles" },
    { icon: "✨", text: "Outils désinfectés et certifiés" },
  ],
  en: [
    { icon: "📍", text: "Mobile service across Montréal" },
    { icon: "💅", text: "Professional nail care at home" },
    { icon: "📅", text: "Flexible appointments" },
    { icon: "✨", text: "Sanitized & certified tools" },
  ],
};

function SuccessOverlay({ name, lang, onDone }: { name: string; lang: "en" | "fr"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(80,0,40,0.75)", backdropFilter: "blur(12px)" }}>
      <div className="text-center px-8">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f4c56a 0%, #e8b050 100%)", boxShadow: "0 0 0 8px rgba(244,197,106,0.15), 0 0 40px rgba(244,197,106,0.35)" }}>
          <svg className="w-10 h-10" style={{ color: "#3a0e00" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-bold text-xl mb-2">
          {lang === "fr" ? "Demande reçue ✦" : "Request received ✦"}
        </p>
        <p className="text-white/70 text-sm">
          {lang === "fr"
            ? `Nous vous confirmons bientôt, ${name}.`
            : `We'll confirm your appointment shortly, ${name}.`}
        </p>
        <p className="text-white/40 text-xs mt-3">
          {lang === "fr" ? "Confirmation dans les 24 h" : "Confirmation within 24 h"}
        </p>
      </div>
    </div>
  );
}

const DRAFT_KEY = "on_booking_draft";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function ShimmerRow() {
  return (
    <div className="h-12 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
  );
}

function BookingInner() {
  const router = useRouter();
  const { t, lang } = useLang();
  const tr = t.book;
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("service") ?? "";

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
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
  const [successData, setSuccessData] = useState<{ name: string; url: string } | null>(null);

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setForm((f) => ({ ...f, ...parsed, service_id: preselectedId || parsed.service_id || "" }));
      }
    } catch { /* ignore */ }
  }, [preselectedId]);

  // Persist draft on change (debounced via state)
  useEffect(() => {
    try {
      if (form.customer_name || form.phone || form.email || form.address) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      }
    } catch { /* ignore */ }
  }, [form]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: Service[]) => { setServices(data); setServicesLoading(false); })
      .catch(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    const url = coords ? `/api/slots?lat=${coords.lat}&lng=${coords.lng}` : "/api/slots";
    fetch(url).then((r) => r.json()).then((data: SlotDay[]) => setSlots(data.slice(0, 5))).catch(() => {});
  }, [coords]);

  useEffect(() => {
    if (preselectedId && services.length > 0) {
      const found = services.find((s) => s.id === preselectedId);
      if (found) setForm((f) => ({ ...f, service_id: found.id }));
    }
  }, [services, preselectedId]);

  const selectedService = services.find((s) => s.id === form.service_id) ?? null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    let { name, value } = e.target;
    if (name === "phone") value = formatPhone(value);
    setForm((f) => ({ ...f, [name]: value }));

    if (name === "address") {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (value.length < 10) { setCoords(null); return; }
      geocodeTimer.current = setTimeout(async () => {
        setGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1&countrycodes=ca`,
            { headers: { "Accept-Language": "fr,en" } }
          );
          const data = await res.json();
          setCoords(data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null);
        } catch { setCoords(null); }
        finally { setGeocoding(false); }
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
        service_requested: selectedSvc ? (lang === "fr" ? selectedSvc.french_name : selectedSvc.english_name) : form.service_id,
        service_id: form.service_id || null,
        notes: form.notes,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? tr.error); return; }
      const successUrl = `/book/success?name=${encodeURIComponent(data.customer_name)}&date=${data.scheduled_date}&time=${data.scheduled_time}&service=${encodeURIComponent(data.service_requested)}`;
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setSuccessData({ name: data.customer_name, url: successUrl });
    } catch {
      setError(tr.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" };
  const inputClass = "w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/35 focus:outline-none transition-all duration-200";

  return (
    <div className="relative min-h-screen">
      {successData && (
        <SuccessOverlay name={successData.name} lang={lang} onDone={() => router.push(successData.url)} />
      )}

      <GoldFlakesAnimation count={9} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />

      {/* Header */}
      <header className="relative z-[2] px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div style={{ width: 30, height: 30, borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/On.png" alt="ON!" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <span className="text-white font-semibold text-sm">Ongles Natalia</span>
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
        </div>
      </header>

      {/* Compact hero */}
      <div className="relative z-[2] px-5 pt-2 pb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">{tr.title}</h1>
        <p className="text-white/55 text-sm max-w-xs mx-auto">{tr.subtitle}</p>
      </div>

      {/* Main layout — form + trust side by side on desktop */}
      <div className="relative z-[2] px-4 pb-24 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-4">

          {/* Availability chips */}
          {slots.length > 0 && (
            <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.13)" }}>
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">
                {lang === "fr" ? "Prochaines disponibilités" : "Next available"}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const d = new Date(s.date + "T12:00:00");
                  const label = d.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={s.date} className="flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all"
                      style={{ background: "rgba(244,197,106,0.10)", border: "1px solid rgba(244,197,106,0.28)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                      <span className="text-white text-xs font-medium capitalize">{label}</span>
                      <span className="text-white/40 text-[10px]">·</span>
                      <span className="text-xs font-semibold" style={{ color: "#f4c56a" }}>
                        {s.available} {lang === "fr" ? (s.available === 1 ? "place" : "places") : (s.available === 1 ? "slot" : "slots")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form card */}
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(244,197,106,0.06), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
            {/* Shimmer top line */}
            <div className="h-px" style={{ background: "linear-gradient(90deg, transparent 0%, #7a0a48 15%, #f4c56a 50%, #7a0a48 85%, transparent 100%)" }} />

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-5 p-3 rounded-2xl text-sm" style={{ background: "rgba(180,30,30,0.25)", border: "1px solid rgba(255,100,100,0.3)", color: "rgba(255,200,200,0.9)" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name + Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {tr.fullName} <span style={{ color: "#f4c56a" }}>*</span>
                    </label>
                    <input name="customer_name" type="text" required value={form.customer_name} onChange={handleChange}
                      placeholder="Jane Smith" autoComplete="name"
                      style={{ ...inputStyle, fontSize: 16 }}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {tr.phone} <span style={{ color: "#f4c56a" }}>*</span>
                    </label>
                    <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                      placeholder="(514) 555-0000" autoComplete="tel"
                      style={{ ...inputStyle, fontSize: 16 }}
                      className={inputClass} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {tr.email} <span style={{ color: "#f4c56a" }}>*</span>
                  </label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange}
                    placeholder="jane@example.com" autoComplete="email"
                    style={{ ...inputStyle, fontSize: 16 }}
                    className={inputClass} />
                </div>

                {/* Address */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {tr.address} <span style={{ color: "#f4c56a" }}>*</span>
                  </label>
                  <div className="relative">
                    <input name="address" type="text" required value={form.address} onChange={handleChange}
                      placeholder={lang === "fr" ? "123 Rue Principale, Montréal, QC" : "123 Main St, Montréal, QC"}
                      autoComplete="street-address"
                      style={{ ...inputStyle, fontSize: 16 }}
                      className={`${inputClass} pr-10`} />
                    {geocoding && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-white/50 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    )}
                    {!geocoding && coords && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4" style={{ color: "#f4c56a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-white/40 pl-1">
                    {coords ? (lang === "fr" ? "✓ Adresse trouvée" : "✓ Address found") : tr.addressHint}
                  </p>
                </div>

                {/* Service */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" /></svg>
                    {tr.service} <span style={{ color: "#f4c56a" }}>*</span>
                  </label>
                  {servicesLoading ? <ShimmerRow /> : <select name="service_id" required value={form.service_id} onChange={handleChange}
                    style={{ ...inputStyle, fontSize: 16 }}
                    className={inputClass}>
                    <option value="" style={{ background: "#6b0f3a" }}>{tr.selectService}</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} style={{ background: "#6b0f3a" }}>
                        {lang === "fr" ? s.french_name : s.english_name}
                      </option>
                    ))}
                  </select>}
                  {selectedService && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(244,197,106,0.10)", border: "1px solid rgba(244,197,106,0.22)" }}>
                      <svg className="w-3.5 h-3.5 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-white/70">{selectedService.duration_label}</span>
                      {selectedService.price !== null && (
                        <><span className="text-white/30">·</span>
                        <span className="text-xs font-bold" style={{ color: "#f4c56a" }}>{formatPrice(selectedService, lang)}</span></>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {tr.notes}
                  </label>
                  <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
                    placeholder={tr.notesPlaceholder}
                    style={{ ...inputStyle, fontSize: 16 }}
                    className={`${inputClass} resize-none`} />
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="btn-press w-full disabled:opacity-60 font-bold py-4 rounded-2xl text-sm tracking-wide transition-all"
                  style={{
                    background: "linear-gradient(135deg, #c8207a 0%, #a01060 40%, #7a0a48 100%)",
                    color: "#fff",
                    boxShadow: "0 6px 28px rgba(160,16,96,0.50), inset 0 1px 0 rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      {tr.submitting}
                    </span>
                  ) : (
                    <span>✦ {tr.submit}</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Trust strip */}
          <div className="flex flex-col items-center gap-3 pt-2 pb-2">
            <div className="flex items-center gap-3 w-full justify-center flex-wrap">
              {TRUST_ITEMS[lang].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm opacity-70">{item.icon}</span>
                  <span className="text-xs text-white/50 font-medium tracking-wide">{item.text}</span>
                  {i < TRUST_ITEMS[lang].length - 1 && (
                    <span className="text-white/20 text-xs ml-1 hidden sm:inline">·</span>
                  )}
                </div>
              ))}
            </div>
            <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(244,197,106,0.3), transparent)" }} />
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
