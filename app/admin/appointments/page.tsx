"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const AppointmentMap = dynamic(() => import("@/components/AppointmentMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-brand-300 text-sm">
      Loading map…
    </div>
  ),
});

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsInner />
    </Suspense>
  );
}

function AppointmentsInner() {
  const searchParams = useSearchParams();
  const dateFilter = searchParams.get("date") ?? "";
  const { t, lang } = useLang();
  const tr = t.appointments;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFilter) params.set("date", dateFilter);
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.customer_name.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.service_requested.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const mapAppts = filtered.filter((a) => a.lat && a.lng);

  function fmtDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString(
      lang === "fr" ? "fr-CA" : "en-CA",
      { weekday: "short", month: "short", day: "numeric" }
    );
  }
  function fmtTime(t: string) {
    return new Date(`2000-01-01T${t}`).toLocaleTimeString(
      lang === "fr" ? "fr-CA" : "en-CA",
      { hour: "numeric", minute: "2-digit" }
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sidebar">{tr.title}</h1>
          {dateFilter && (
            <p className="text-sm text-brand-400 mt-0.5">
              {tr.showing} {fmtDate(dateFilter)}{" "}
              <Link href="/admin/appointments" className="text-brand-600 hover:underline">
                {tr.clear}
              </Link>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {mapAppts.length > 0 && (
            <button
              onClick={() => setShowMap((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-100 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? tr.hideMap : tr.showMap}
            </button>
          )}
          <Link
            href="/book"
            target="_blank"
            className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {tr.newBooking}
          </Link>
        </div>
      </div>

      {/* Map */}
      {showMap && mapAppts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden" style={{ height: 300 }}>
          <AppointmentMap appointments={mapAppts} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 min-w-[200px] bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-brand-100 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="">{tr.allStatuses}</option>
          {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
            <option key={s} value={s}>{t.statuses[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-brand-300 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-brand-300 text-sm">{tr.noFound}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50 border-b border-brand-100">
                  {[tr.customer, tr.service, tr.address, tr.dateTime, tr.status, ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sidebar">{a.customer_name}</div>
                      <div className="text-xs text-brand-400">{a.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[130px] truncate">{a.service_requested}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate" title={a.address}>{a.address}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.scheduled_date ? (
                        <>
                          <div className="text-sidebar capitalize">{fmtDate(a.scheduled_date)}</div>
                          {a.scheduled_time && (
                            <div className="text-xs text-brand-400">{fmtTime(a.scheduled_time)}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-brand-200">{tr.unscheduled}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                        {t.statuses[a.status as keyof typeof t.statuses] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/appointments/${a.id}`} className="text-brand-500 hover:text-brand-700 font-semibold text-xs">
                        {tr.edit}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-brand-300">{tr.count(filtered.length)}</p>
    </div>
  );
}
