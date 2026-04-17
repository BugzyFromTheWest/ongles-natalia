"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";

type AnalyticsData = {
  total: number;
  byStatus: { pending: number; confirmed: number; completed: number; cancelled: number };
  months: [string, number][];
  topServices: { name: string; count: number }[];
  busyDays: { name: string; count: number }[];
  returningClients: number;
  totalClients: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-brand-400",
  completed: "bg-green-400",
  cancelled: "bg-red-400",
};

export default function AnalyticsPage() {
  const { lang } = useLang();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load analytics.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-brand-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        {error || "No data available."}
      </div>
    );
  }

  const maxMonth = Math.max(...data.months.map(([, c]) => c), 1);
  const maxDay = Math.max(...data.busyDays.map((d) => d.count), 1);
  const maxService = Math.max(...data.topServices.map((s) => s.count), 1);

  function fmtMonth(m: string) {
    const [year, month] = m.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", { month: "short", year: "2-digit" });
  }

  const statusLabels: Record<string, string> = {
    pending: lang === "fr" ? "En attente" : "Pending",
    confirmed: lang === "fr" ? "Confirmé" : "Confirmed",
    completed: lang === "fr" ? "Terminé" : "Completed",
    cancelled: lang === "fr" ? "Annulé" : "Cancelled",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sidebar">
          {lang === "fr" ? "Analytique" : "Analytics"}
        </h1>
        <p className="text-sm text-brand-400 mt-0.5">
          {lang === "fr" ? "Aperçu des réservations et clients" : "Booking and client overview"}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
            {lang === "fr" ? "Total réservations" : "Total Bookings"}
          </p>
          <p className="text-3xl font-bold text-sidebar">{data.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
            {lang === "fr" ? "Clients uniques" : "Unique Clients"}
          </p>
          <p className="text-3xl font-bold text-brand-600">{data.totalClients}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
            {lang === "fr" ? "Clients fidèles" : "Returning Clients"}
          </p>
          <p className="text-3xl font-bold text-green-600">{data.returningClients}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
            {lang === "fr" ? "Taux de retour" : "Return Rate"}
          </p>
          <p className="text-3xl font-bold text-yellow-600">
            {data.totalClients > 0 ? Math.round((data.returningClients / data.totalClients) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
        <h2 className="font-semibold text-sidebar mb-4">
          {lang === "fr" ? "Réservations par statut" : "Bookings by Status"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
            <div key={s} className={`rounded-xl px-4 py-3 ${STATUS_COLORS[s]}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                {statusLabels[s]}
              </p>
              <p className="text-2xl font-bold">{data.byStatus[s]}</p>
              {data.total > 0 && (
                <p className="text-xs opacity-60 mt-0.5">
                  {Math.round((data.byStatus[s] / data.total) * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bookings per month */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          <h2 className="font-semibold text-sidebar mb-4">
            {lang === "fr" ? "Réservations par mois (6 derniers)" : "Bookings per Month (last 6)"}
          </h2>
          {data.months.length === 0 ? (
            <p className="text-brand-300 text-sm text-center py-6">
              {lang === "fr" ? "Aucune donnée" : "No data yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {data.months.map(([month, count]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-brand-400 w-16 shrink-0 font-medium">{fmtMonth(month)}</span>
                  <div className="flex-1 bg-brand-50 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-brand-400 rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max((count / maxMonth) * 100, 4)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white leading-none">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Busiest days */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          <h2 className="font-semibold text-sidebar mb-4">
            {lang === "fr" ? "Jours les plus occupés" : "Busiest Days of Week"}
          </h2>
          <div className="space-y-3">
            {data.busyDays.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-xs text-brand-400 w-10 shrink-0 font-medium">{d.name}</span>
                <div className="flex-1 bg-brand-50 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-gold-400 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max(d.count > 0 ? (d.count / maxDay) * 100 : 0, d.count > 0 ? 4 : 0)}%` }}
                  >
                    {d.count > 0 && (
                      <span className="text-[10px] font-bold text-white leading-none">{d.count}</span>
                    )}
                  </div>
                </div>
                {d.count === 0 && <span className="text-xs text-brand-200">—</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top services */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
        <h2 className="font-semibold text-sidebar mb-4">
          {lang === "fr" ? "Services les plus populaires" : "Top 5 Services"}
        </h2>
        {data.topServices.length === 0 ? (
          <p className="text-brand-300 text-sm text-center py-6">
            {lang === "fr" ? "Aucune donnée" : "No data yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {data.topServices.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-brand-300 w-5 shrink-0">#{i + 1}</span>
                <span className="text-sm text-sidebar flex-1 min-w-0 truncate" title={s.name}>{s.name}</span>
                <div className="w-32 bg-brand-50 rounded-full h-5 overflow-hidden shrink-0">
                  <div
                    className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((s.count / maxService) * 100, 12)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white leading-none">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
