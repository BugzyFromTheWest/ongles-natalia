"use client";

import { useEffect, useState } from "react";
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
  active: number;
  sort_order: number;
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

function formatPrice(s: Service) {
  if (s.price_type === "variable") return "Variable";
  if (s.price === null) return "—";
  const prefix = s.price_type === "starting_at" ? "À partir de " : "";
  return `${prefix}$${s.price}`;
}

export default function AdminServicesPage() {
  const { t, lang } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadServices() {
    const res = await fetch("/api/services?all=1");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, []);

  async function toggleActive(svc: Service) {
    await fetch(`/api/services/${svc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: svc.active ? 0 : 1 }),
    });
    loadServices();
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, Service[]>>((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sidebar">
            {lang === "fr" ? "Gestion des services" : "Service Management"}
          </h1>
          <p className="text-sm text-brand-400 mt-0.5">
            {lang === "fr"
              ? "Gérez le menu des services affiché aux clientes"
              : "Manage the service menu shown to clients"}
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-300/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {lang === "fr" ? "Nouveau service" : "New Service"}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-brand-300">
          {lang === "fr" ? "Chargement…" : "Loading…"}
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
            <div key={cat} className="bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className="px-5 py-3 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                <span className="font-semibold text-sidebar text-sm">
                  {CATEGORY_LABELS[cat]?.[lang] ?? cat}
                </span>
                <span className="text-xs text-brand-400">
                  {grouped[cat].filter((s) => s.active).length} / {grouped[cat].length}{" "}
                  {lang === "fr" ? "actifs" : "active"}
                </span>
              </div>

              {/* Services */}
              <div className="divide-y divide-brand-50">
                {grouped[cat].map((svc) => (
                  <div
                    key={svc.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                      svc.active ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(svc)}
                      title={svc.active ? (lang === "fr" ? "Désactiver" : "Deactivate") : (lang === "fr" ? "Activer" : "Activate")}
                      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                        svc.active ? "bg-brand-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          svc.active ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    {/* Name + details */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${svc.active ? "text-sidebar" : "text-slate-400"}`}>
                        {lang === "fr" ? svc.french_name : svc.english_name}
                      </div>
                      {lang === "fr" ? (
                        <div className="text-xs text-brand-400 mt-0.5">{svc.english_name}</div>
                      ) : (
                        <div className="text-xs text-brand-400 mt-0.5">{svc.french_name}</div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="text-xs text-slate-500 shrink-0 hidden sm:block">
                      {svc.duration_label}
                    </div>

                    {/* Price */}
                    <div className="text-sm font-semibold text-sidebar shrink-0 w-24 text-right">
                      {formatPrice(svc)}
                    </div>

                    {/* Edit link */}
                    <Link
                      href={`/admin/services/${svc.id}`}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold transition-colors border border-brand-100"
                    >
                      {lang === "fr" ? "Modifier" : "Edit"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
