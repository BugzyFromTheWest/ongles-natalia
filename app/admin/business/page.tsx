"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";

type BusinessInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  gift_card_url: string;
  hours: string;
};

type HoursMap = Record<string, string>;

const DAY_LABELS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_LABELS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminBusinessPage() {
  const { lang } = useLang();
  const [form, setForm] = useState<BusinessInfo>({
    name: "",
    address: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    gift_card_url: "",
    hours: "{}",
  });
  const [hours, setHours] = useState<HoursMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data: BusinessInfo) => {
        setForm(data);
        try { setHours(JSON.parse(data.hours)); } catch { setHours({}); }
        setLoading(false);
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleHourChange(day: string, value: string) {
    setHours((h) => ({ ...h, [day]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours: JSON.stringify(hours) }),
      });
      if (!res.ok) { setError(lang === "fr" ? "Erreur d'enregistrement" : "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(lang === "fr" ? "Erreur réseau" : "Network error");
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-xl font-bold text-sidebar">
          {lang === "fr" ? "Informations commerciales" : "Business Information"}
        </h1>
        <p className="text-sm text-brand-400 mt-0.5">
          {lang === "fr"
            ? "Mettez à jour les informations affichées sur le site public"
            : "Update the information displayed on the public site"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar mb-1">
            {lang === "fr" ? "Informations de base" : "Basic Information"}
          </h2>

          <div>
            <label className={labelClass}>{lang === "fr" ? "Nom du commerce" : "Business Name"}</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{lang === "fr" ? "Adresse" : "Address"}</label>
            <input name="address" type="text" value={form.address} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{lang === "fr" ? "Téléphone" : "Phone"}</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{lang === "fr" ? "Courriel" : "Email"}</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Social & Links */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-sidebar mb-1">
            {lang === "fr" ? "Liens & réseaux sociaux" : "Links & Social Media"}
          </h2>

          <div>
            <label className={labelClass}>Instagram URL</label>
            <input name="instagram" type="url" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Facebook URL</label>
            <input name="facebook" type="url" value={form.facebook} onChange={handleChange} placeholder="https://facebook.com/..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{lang === "fr" ? "URL des cartes-cadeaux" : "Gift Card URL"}</label>
            <input name="gift_card_url" type="url" value={form.gift_card_url} onChange={handleChange} placeholder="https://..." className={inputClass} />
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-3">
          <h2 className="text-sm font-bold text-sidebar mb-1">
            {lang === "fr" ? "Heures d'ouverture" : "Opening Hours"}
          </h2>
          <p className="text-xs text-brand-400">
            {lang === "fr"
              ? "Entrez les heures au format libre, ex: « 9h – 18h » ou « Fermé »"
              : "Enter hours in free format, e.g. \"9am – 6pm\" or \"Closed\""}
          </p>

          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm text-sidebar/70 w-28 shrink-0">
                  {lang === "fr" ? DAY_LABELS_FR[day] : DAY_LABELS_EN[day]}
                </span>
                <input
                  type="text"
                  value={hours[String(day)] ?? ""}
                  onChange={(e) => handleHourChange(String(day), e.target.value)}
                  placeholder={lang === "fr" ? "Fermé" : "Closed"}
                  className="flex-1 border border-brand-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-brand-50/20 placeholder:text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Status + Submit */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        {saved && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {lang === "fr" ? "Enregistré avec succès." : "Saved successfully."}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-brand-300/20"
        >
          {saving
            ? (lang === "fr" ? "Enregistrement…" : "Saving…")
            : (lang === "fr" ? "Enregistrer" : "Save Changes")}
        </button>
      </form>
    </div>
  );
}
