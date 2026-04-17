"use client";

import { useEffect, useState, useRef } from "react";
import { useLang } from "@/components/LangProvider";

type Settings = {
  max_appointments_per_day: number;
  working_hours_start: string;
  working_hours_end: string;
  appointment_duration_minutes: number;
  buffer_minutes: number;
  unavailable_days: string;
  working_days: string;
  cluster_radius_km: number;
};

export default function SettingsPage() {
  const { t, lang } = useLang();
  const tr = t.settings;

  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newUnavailable, setNewUnavailable] = useState("");

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const pwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setForm(d));
  }, []);

  if (!form) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-brand-400 text-sm">Loading…</span>
      </div>
    );
  }

  const workingDays: number[] = JSON.parse(form.working_days);
  const unavailableDays: string[] = JSON.parse(form.unavailable_days);

  const DAYS = tr.days.map((label, value) => ({ label, value }));

  function toggleWorkingDay(day: number) {
    const days = workingDays.includes(day)
      ? workingDays.filter((d) => d !== day)
      : [...workingDays, day].sort();
    setForm((f) => f ? { ...f, working_days: JSON.stringify(days) } : f);
  }

  function addUnavailable() {
    if (!newUnavailable || unavailableDays.includes(newUnavailable)) { setNewUnavailable(""); return; }
    const updated = [...unavailableDays, newUnavailable].sort();
    setForm((f) => f ? { ...f, unavailable_days: JSON.stringify(updated) } : f);
    setNewUnavailable("");
  }

  function removeUnavailable(date: string) {
    const updated = unavailableDays.filter((d) => d !== date);
    setForm((f) => f ? { ...f, unavailable_days: JSON.stringify(updated) } : f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setForm((f) => f ? { ...f, [name]: type === "number" ? Number(value) : value } : f);
  }

  function estSlots() {
    if (!form) return 0;
    const [sh, sm] = form.working_hours_start.split(":").map(Number);
    const [eh, em] = form.working_hours_end.split(":").map(Number);
    const slotSize = form.appointment_duration_minutes + form.buffer_minutes;
    return Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / slotSize);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError(tr.saveFailed); return; }
      const updated = await res.json();
      setForm(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(tr.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-brand-50/20";
  const label = "block text-[10px] font-semibold text-brand-400 mb-1.5 uppercase tracking-wider";
  const section = "bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-4";

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sidebar">{tr.title}</h1>
        <p className="text-sm text-brand-400 mt-0.5">{tr.subtitle}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✓ {tr.saved}</div>
        )}

        {/* Schedule */}
        <div className={section}>
          <h2 className="font-semibold text-sidebar">{tr.schedule}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>{tr.workStart}</label>
              <input name="working_hours_start" type="time" value={form.working_hours_start} onChange={handleChange} className={field} />
            </div>
            <div>
              <label className={label}>{tr.workEnd}</label>
              <input name="working_hours_end" type="time" value={form.working_hours_end} onChange={handleChange} className={field} />
            </div>
            <div>
              <label className={label}>{tr.duration}</label>
              <input name="appointment_duration_minutes" type="number" min={15} max={480} value={form.appointment_duration_minutes} onChange={handleChange} className={field} />
            </div>
            <div>
              <label className={label}>{tr.buffer}</label>
              <input name="buffer_minutes" type="number" min={0} max={120} value={form.buffer_minutes} onChange={handleChange} className={field} />
            </div>
          </div>
          <div>
            <label className={label}>{tr.maxPerDay}</label>
            <input name="max_appointments_per_day" type="number" min={1} max={50} value={form.max_appointments_per_day} onChange={handleChange} className={`${field} sm:w-36`} />
            <p className="mt-1.5 text-xs text-brand-300">
              {tr.slotsInfo(estSlots(), Math.min(form.max_appointments_per_day, estSlots()))}
            </p>
          </div>
        </div>

        {/* Working days */}
        <div className={section}>
          <h2 className="font-semibold text-sidebar">{tr.workingDays}</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(({ label: dayLabel, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleWorkingDay(value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  workingDays.includes(value)
                    ? "bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-brand-200 hover:text-brand-500"
                }`}
              >
                {dayLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Geo clustering */}
        <div className={section}>
          <h2 className="font-semibold text-sidebar">{tr.geo}</h2>
          <div>
            <label className={label}>{tr.clusterRadius}</label>
            <input name="cluster_radius_km" type="number" min={1} max={500} step={1} value={form.cluster_radius_km} onChange={handleChange} className={`${field} sm:w-36`} />
            <p className="mt-1.5 text-xs text-brand-300">{tr.clusterHint}</p>
          </div>
        </div>

        {/* Unavailable dates */}
        <div className={section}>
          <h2 className="font-semibold text-sidebar">{tr.unavailable}</h2>
          <p className="text-xs text-brand-300">{tr.unavailableHint}</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={newUnavailable}
              onChange={(e) => setNewUnavailable(e.target.value)}
              className="border border-brand-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button
              type="button"
              onClick={addUnavailable}
              className="px-5 py-2.5 bg-sidebar hover:bg-sidebar/90 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {tr.add}
            </button>
          </div>
          {unavailableDays.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unavailableDays.map((d) => (
                <span key={d} className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 text-brand-700 text-xs px-3 py-1.5 rounded-full">
                  {new Date(d + "T12:00:00").toLocaleDateString("en-CA", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                  <button type="button" onClick={() => removeUnavailable(d)} className="text-brand-300 hover:text-brand-600 transition-colors font-bold">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-brand-200"
          >
            {saving ? tr.saving : tr.save}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <div ref={pwRef} className={section}>
        <h2 className="font-semibold text-sidebar">{lang === "fr" ? "Changer le mot de passe" : "Change Password"}</h2>
        {pwError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            ✓ {lang === "fr" ? "Mot de passe modifié avec succès." : "Password changed successfully."}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPwError("");
            setPwSuccess(false);
            if (pwForm.newPassword !== pwForm.confirmPassword) {
              setPwError(lang === "fr" ? "Les mots de passe ne correspondent pas." : "New passwords do not match.");
              return;
            }
            setPwSaving(true);
            try {
              const res = await fetch("/api/admin/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentPassword: pwForm.currentPassword,
                  newPassword: pwForm.newPassword,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setPwError(data.error || (lang === "fr" ? "Erreur serveur." : "Server error."));
              } else {
                setPwSuccess(true);
                setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setTimeout(() => setPwSuccess(false), 4000);
              }
            } catch {
              setPwError(lang === "fr" ? "Erreur réseau." : "Network error.");
            } finally {
              setPwSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className={label}>{lang === "fr" ? "Mot de passe actuel" : "Current Password"}</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              className={field}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className={label}>{lang === "fr" ? "Nouveau mot de passe" : "New Password"}</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              minLength={8}
              className={field}
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-xs text-brand-300">{lang === "fr" ? "Minimum 8 caractères." : "Minimum 8 characters."}</p>
          </div>
          <div>
            <label className={label}>{lang === "fr" ? "Confirmer le nouveau mot de passe" : "Confirm New Password"}</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              minLength={8}
              className={field}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-7 py-3 bg-sidebar hover:bg-sidebar/90 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {pwSaving
                ? (lang === "fr" ? "Enregistrement…" : "Saving…")
                : (lang === "fr" ? "Changer le mot de passe" : "Change Password")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
