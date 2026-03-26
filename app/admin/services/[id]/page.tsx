"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";

type ServiceForm = {
  category: string;
  french_name: string;
  english_name: string;
  price_type: "fixed" | "starting_at" | "variable";
  price: string;
  duration_minutes: string;
  duration_label: string;
  description_fr: string;
  description_en: string;
  active: boolean;
  sort_order: string;
};

const EMPTY_FORM: ServiceForm = {
  category: "manicure",
  french_name: "",
  english_name: "",
  price_type: "fixed",
  price: "",
  duration_minutes: "60",
  duration_label: "1 h",
  description_fr: "",
  description_en: "",
  active: true,
  sort_order: "0",
};

const CATEGORIES = ["manicure", "pedicure", "extensions", "nail_art", "courses", "repairs"];
const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  manicure:   { fr: "Manucure",    en: "Manicure" },
  pedicure:   { fr: "Pédicure",    en: "Pedicure" },
  extensions: { fr: "Extensions",  en: "Extensions" },
  nail_art:   { fr: "Nail Art",    en: "Nail Art" },
  courses:    { fr: "Cours",       en: "Courses" },
  repairs:    { fr: "Réparations", en: "Repairs" },
};

export default function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const { lang } = useLang();

  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          category: data.category ?? "manicure",
          french_name: data.french_name ?? "",
          english_name: data.english_name ?? "",
          price_type: data.price_type ?? "fixed",
          price: data.price != null ? String(data.price) : "",
          duration_minutes: String(data.duration_minutes ?? 60),
          duration_label: data.duration_label ?? "1 h",
          description_fr: data.description_fr ?? "",
          description_en: data.description_en ?? "",
          active: Boolean(data.active),
          sort_order: String(data.sort_order ?? 0),
        });
        setLoading(false);
      });
  }, [id, isNew]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f) => ({ ...f, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      category: form.category,
      french_name: form.french_name,
      english_name: form.english_name,
      price_type: form.price_type,
      price: form.price_type === "variable" ? null : form.price ? parseFloat(form.price) : null,
      duration_minutes: parseInt(form.duration_minutes),
      duration_label: form.duration_label,
      description_fr: form.description_fr,
      description_en: form.description_en,
      active: form.active ? 1 : 0,
      sort_order: parseInt(form.sort_order) || 0,
    };

    try {
      const res = isNew
        ? await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/services/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        setError(lang === "fr" ? "Erreur d'enregistrement" : "Save failed");
        return;
      }
      router.push("/admin/services");
    } catch {
      setError(lang === "fr" ? "Erreur réseau" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(lang === "fr" ? "Supprimer ce service ?" : "Delete this service?")) return;
    setDeleting(true);
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    router.push("/admin/services");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-400">
        {lang === "fr" ? "Chargement…" : "Loading…"}
      </div>
    );
  }

  const inputClass =
    "w-full border border-brand-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/30 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-sidebar/70 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/services")}
            className="text-xs text-brand-400 hover:text-brand-600 transition-colors mb-1 flex items-center gap-1"
          >
            ← {lang === "fr" ? "Retour aux services" : "Back to services"}
          </button>
          <h1 className="text-xl font-bold text-sidebar">
            {isNew
              ? (lang === "fr" ? "Nouveau service" : "New Service")
              : (lang === "fr" ? "Modifier le service" : "Edit Service")}
          </h1>
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors border border-red-100"
          >
            {deleting ? (lang === "fr" ? "Suppression…" : "Deleting…") : (lang === "fr" ? "Supprimer" : "Delete")}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category + Status */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar">
            {lang === "fr" ? "Catégorie & statut" : "Category & Status"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{lang === "fr" ? "Catégorie" : "Category"}</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]?.[lang] ?? cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{lang === "fr" ? "Ordre d'affichage" : "Sort Order"}</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm text-sidebar/80">
              {lang === "fr" ? "Service actif (visible aux clientes)" : "Active (visible to clients)"}
            </span>
          </label>
        </div>

        {/* Names */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar">{lang === "fr" ? "Noms bilingues" : "Bilingual Names"}</h2>

          <div>
            <label className={labelClass}>Nom français <span className="text-brand-500">*</span></label>
            <input name="french_name" type="text" required value={form.french_name} onChange={handleChange} placeholder="Manucure en gel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>English Name <span className="text-brand-500">*</span></label>
            <input name="english_name" type="text" required value={form.english_name} onChange={handleChange} placeholder="Gel Manicure" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{lang === "fr" ? "Description (FR)" : "Description (FR)"}</label>
            <textarea name="description_fr" rows={2} value={form.description_fr} onChange={handleChange} placeholder="Description en français…" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>{lang === "fr" ? "Description (EN)" : "Description (EN)"}</label>
            <textarea name="description_en" rows={2} value={form.description_en} onChange={handleChange} placeholder="English description…" className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar">{lang === "fr" ? "Tarification" : "Pricing"}</h2>

          <div>
            <label className={labelClass}>{lang === "fr" ? "Type de prix" : "Price Type"}</label>
            <select name="price_type" value={form.price_type} onChange={handleChange} className={inputClass}>
              <option value="fixed">{lang === "fr" ? "Fixe" : "Fixed"}</option>
              <option value="starting_at">{lang === "fr" ? "À partir de" : "Starting at"}</option>
              <option value="variable">{lang === "fr" ? "Variable" : "Variable"}</option>
            </select>
          </div>

          {form.price_type !== "variable" && (
            <div>
              <label className={labelClass}>{lang === "fr" ? "Prix ($)" : "Price ($)"}</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar">{lang === "fr" ? "Durée" : "Duration"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{lang === "fr" ? "Durée (minutes)" : "Duration (minutes)"}</label>
              <input name="duration_minutes" type="number" min="1" value={form.duration_minutes} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{lang === "fr" ? "Étiquette affichée" : "Display Label"}</label>
              <input name="duration_label" type="text" value={form.duration_label} onChange={handleChange} placeholder="1 h 30 min" className={inputClass} />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand-300/20"
        >
          {saving
            ? (lang === "fr" ? "Enregistrement…" : "Saving…")
            : isNew
              ? (lang === "fr" ? "Créer le service" : "Create Service")
              : (lang === "fr" ? "Enregistrer" : "Save Changes")}
        </button>
      </form>
    </div>
  );
}
