"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";

type Appointment = {
  id: string;
  customer_name: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  created_at: string;
};

type Settings = { max_appointments_per_day: number };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { t, lang } = useLang();
  const tr = t.dashboard;

  const [all, setAll] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([appts, sets]) => {
      setAll(appts);
      setSettings(sets);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStr = weekEnd.toISOString().split("T")[0];

  const todayAppts = all.filter((a) => a.scheduled_date === today);
  const weekAppts = all.filter(
    (a) => a.scheduled_date && a.scheduled_date >= today && a.scheduled_date <= weekStr
  );
  const pending = all.filter((a) => a.status === "pending");
  const recent = [...all]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const upcomingDates = Array.from(
    new Set(
      all
        .filter(
          (a) =>
            a.scheduled_date &&
            a.scheduled_date >= today &&
            a.scheduled_date <= weekStr &&
            a.status !== "cancelled"
        )
        .map((a) => a.scheduled_date!)
    )
  ).sort();

  const maxSlots = settings?.max_appointments_per_day ?? 6;

  function fmtDate(date: string) {
    return new Date(date + "T12:00:00").toLocaleDateString(
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
  function fmtCreated(s: string) {
    return new Date(s).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
      month: "short", day: "numeric",
    });
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sidebar">{tr.title}</h1>
        <p className="text-sm text-brand-400 mt-0.5">
          {new Date().toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: tr.total, value: all.length, accent: "text-sidebar" },
          { label: tr.pending, value: pending.length, accent: "text-yellow-600" },
          { label: tr.today, value: todayAppts.length, accent: "text-brand-600" },
          { label: tr.week, value: weekAppts.length, accent: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Week schedule */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-50 flex items-center justify-between">
            <h2 className="font-semibold text-sidebar">{tr.weekSchedule}</h2>
            <Link href="/admin/calendar" className="text-sm text-brand-500 hover:text-brand-700 font-medium">
              {tr.viewCalendar}
            </Link>
          </div>
          {upcomingDates.length === 0 ? (
            <div className="px-5 py-10 text-center text-brand-300 text-sm">{tr.noUpcoming}</div>
          ) : (
            <div className="divide-y divide-brand-50">
              {upcomingDates.map((date) => {
                const dayAppts = all.filter(
                  (a) => a.scheduled_date === date && a.status !== "cancelled"
                );
                const pct = Math.round((dayAppts.length / maxSlots) * 100);
                return (
                  <div key={date} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-sidebar capitalize">{fmtDate(date)}</span>
                        {date === today && (
                          <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold tracking-wide">
                            {tr.todayBadge}
                          </span>
                        )}
                      </div>
                      <Link href={`/admin/appointments?date=${date}`} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                        {tr.appts(dayAppts.length)}
                      </Link>
                    </div>
                    <div className="w-full bg-brand-50 rounded-full h-1 mb-2.5">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          pct >= 100 ? "bg-red-400" : pct >= 75 ? "bg-yellow-400" : "bg-brand-400"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayAppts.slice(0, 4).map((a) => (
                        <Link
                          key={a.id}
                          href={`/admin/appointments/${a.id}`}
                          className="text-xs bg-brand-50 border border-brand-100 rounded-lg px-2 py-1 hover:bg-brand-100 transition-colors truncate max-w-[160px] text-brand-700"
                          title={a.customer_name}
                        >
                          {a.scheduled_time ? fmtTime(a.scheduled_time) : ""} {a.customer_name}
                        </Link>
                      ))}
                      {dayAppts.length > 4 && (
                        <span className="text-xs text-brand-400 px-2 py-1">+{dayAppts.length - 4}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-50 flex items-center justify-between">
            <h2 className="font-semibold text-sidebar">{tr.recentBookings}</h2>
            <Link href="/admin/appointments" className="text-sm text-brand-500 hover:text-brand-700 font-medium">
              {tr.viewAll}
            </Link>
          </div>
          <div className="divide-y divide-brand-50">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-brand-300 text-sm">{tr.noBookings}</div>
            ) : (
              recent.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/appointments/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand-600">
                      {a.customer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sidebar truncate">{a.customer_name}</p>
                    <p className="text-xs text-brand-400 truncate capitalize">
                      {a.scheduled_date ? fmtDate(a.scheduled_date) : "—"}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${STATUS_COLORS[a.status]}`}>
                    {t.statuses[a.status as keyof typeof t.statuses] ?? a.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-800">
            <strong>{tr.pendingAlert(pending.length)}</strong>{" "}
            <Link href="/admin/appointments?status=pending" className="underline font-medium">
              {tr.reviewNow}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
