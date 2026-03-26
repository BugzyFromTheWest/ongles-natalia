"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";

type Service = {
  id: string;
  category: string;
  french_name: string;
  english_name: string;
  price_type: "fixed" | "starting_at" | "variable";
  price: number | null;
  duration_label: string;
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

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => {});
  }, []);

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
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #7b2d55 0%, #4a1835 60%, #2a1020 100%)" }}>
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <SparkleIcon className="w-5 h-5 text-gold-300" />
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
      <div className="px-6 pt-6 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <SparkleIcon className="w-3.5 h-3.5 text-gold-300" />
          <span className="text-white/80 text-xs tracking-widest uppercase font-medium">{t.appTagline}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
          {tr.title}
        </h1>
        <p className="text-white/60 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          {tr.subtitle}
        </p>
      </div>

      {/* Form card */}
      <div className="px-4 pb-16 flex justify-center">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Gold accent line */}
          <div className="h-1 bg-gradient-to-r from-brand-400 via-gold-400 to-brand-300" />

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                    {tr.fullName} <span className="text-brand-500">*</span>
                  </label>
                  <input
                    name="customer_name"
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                    {tr.phone} <span className="text-brand-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(514) 555-0000"
                    className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                  {tr.email} <span className="text-brand-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                  {tr.address} <span className="text-brand-500">*</span>
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder={lang === "fr" ? "123 Rue Principale, Montréal, QC" : "123 Main St, Montréal, QC"}
                  className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400"
                />
                <p className="mt-1.5 text-xs text-brand-400">{tr.addressHint}</p>
              </div>

              {/* Service Selector */}
              <div>
                <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                  {tr.service} <span className="text-brand-500">*</span>
                </label>
                <select
                  name="service_id"
                  required
                  value={form.service_id}
                  onChange={handleChange}
                  className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-white"
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
                  <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-brand-50 rounded-xl border border-brand-100">
                    <svg className="w-3.5 h-3.5 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-brand-500">{selectedService.duration_label}</span>
                    {selectedService.price !== null && (
                      <>
                        <span className="text-brand-300">·</span>
                        <span className="text-xs font-semibold text-brand-600">
                          {formatPrice(selectedService, lang)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider">
                  {tr.notes}
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={tr.notesPlaceholder}
                  className="w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-300/30"
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
