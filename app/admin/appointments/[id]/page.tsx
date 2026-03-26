"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";

type Appointment = {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  lat: number | null;
  lng: number | null;
  service_requested: string;
  notes: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-brand-100 text-brand-700 border-brand-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLang();
  const tr = t.detail;
  const statuses = Object.keys(STATUS_STYLES);

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Partial<Appointment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAppt(data);
        setForm(data);
        setLoading(false);
      });
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tr.saveFailed);
        return;
      }
      setAppt(data);
      setForm(data);
      setSuccess(tr.save);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError(tr.networkError);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: string) {
    setSaving(true);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setAppt(data);
    setForm(data);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(tr.deleteConfirm)) return;
    setDeleting(true);
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    router.push("/admin/appointments");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-brand-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-400">{tr.notFound}</p>
        <a href="/admin/appointments" className="text-brand-600 underline mt-2 inline-block text-sm">
          {tr.backToList}
        </a>
      </div>
    );
  }

  function fmtCreated(s: string) {
    return new Date(s).toLocaleString("en-CA", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  const field = "w-full border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-brand-50/20";
  const label = "block text-[10px] font-semibold text-brand-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-sidebar flex-1">{appt.customer_name}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[appt.status]}`}>
          {t.statuses[appt.status as keyof typeof t.statuses] ?? appt.status}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium"
        >
          {deleting ? tr.deleting : tr.delete}
        </button>
      </div>

      {/* Status buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-4">
        <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-3">{tr.statusLabel}</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={saving || appt.status === s}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                appt.status === s
                  ? STATUS_STYLES[s]
                  : "bg-white text-slate-500 border-slate-200 hover:bg-brand-50"
              }`}
            >
              {t.statuses[s as keyof typeof t.statuses] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-5">
        <h2 className="font-semibold text-sidebar">{tr.detailsTitle}</h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✓ {success}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>{tr.fullName}</label>
            <input name="customer_name" type="text" required value={form.customer_name ?? ""} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{tr.phone}</label>
            <input name="phone" type="tel" required value={form.phone ?? ""} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{tr.email}</label>
            <input name="email" type="email" required value={form.email ?? ""} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{tr.service}</label>
            <input name="service_requested" type="text" required value={form.service_requested ?? ""} onChange={handleChange} className={field} />
          </div>
        </div>

        <div>
          <label className={label}>{tr.address}</label>
          <input name="address" type="text" required value={form.address ?? ""} onChange={handleChange} className={field} />
          {appt.lat && appt.lng && (
            <p className="mt-1 text-xs text-brand-300">{tr.geocoded} {appt.lat.toFixed(5)}, {appt.lng.toFixed(5)}</p>
          )}
          {!appt.lat && (
            <p className="mt-1 text-xs text-yellow-600">{tr.noGeocode}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>
              {tr.scheduledDate} <span className="text-brand-300 font-normal normal-case tracking-normal">{tr.manualOverride}</span>
            </label>
            <input name="scheduled_date" type="date" value={form.scheduled_date ?? ""} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{tr.scheduledTime}</label>
            <input name="scheduled_time" type="time" value={form.scheduled_time ?? ""} onChange={handleChange} className={field} />
          </div>
        </div>

        <div>
          <label className={label}>{tr.notes}</label>
          <textarea name="notes" rows={3} value={form.notes ?? ""} onChange={handleChange} placeholder={tr.notesPlaceholder} className={`${field} resize-none`} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-brand-300">{tr.booked} {fmtCreated(appt.created_at)}</p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-brand-200"
          >
            {saving ? tr.saving : tr.save}
          </button>
        </div>
      </form>
    </div>
  );
}
