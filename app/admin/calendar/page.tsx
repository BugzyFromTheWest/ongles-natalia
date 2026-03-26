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
  address: string;
};

type Settings = {
  max_appointments_per_day: number;
  working_days: string;
  unavailable_days: string;
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-brand-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

export default function CalendarPage() {
  const { t, lang } = useLang();
  const tr = t.calendar;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([appts, sets]) => {
      setAppointments(appts);
      setSettings(sets);
      setLoading(false);
    });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split("T")[0];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const workingDays: number[] = settings ? JSON.parse(settings.working_days) : [1, 2, 3, 4, 5];
  const unavailableDays: string[] = settings ? JSON.parse(settings.unavailable_days) : [];
  const maxPerDay = settings?.max_appointments_per_day ?? 6;

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function appsOnDay(day: number) {
    return appointments.filter(
      (a) => a.scheduled_date === dateStr(day) && a.status !== "cancelled"
    );
  }

  function dayClasses(day: number) {
    const ds = dateStr(day);
    const dow = new Date(ds + "T12:00:00").getDay();
    if (!workingDays.includes(dow) || unavailableDays.includes(ds)) {
      return "bg-slate-50 opacity-40 cursor-default";
    }
    const count = appsOnDay(day).length;
    const pct = count / maxPerDay;
    if (pct === 0) return "bg-white hover:bg-brand-50 cursor-pointer";
    if (pct < 0.5) return "bg-brand-50 hover:bg-brand-100 cursor-pointer";
    if (pct < 0.85) return "bg-brand-100 hover:bg-brand-200 cursor-pointer";
    return "bg-brand-200 hover:bg-brand-300 cursor-pointer";
  }

  const selectedAppts = selectedDate
    ? appointments
        .filter((a) => a.scheduled_date === selectedDate)
        .sort((a, b) => (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? ""))
    : [];

  function fmtTime(time: string) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString(
      lang === "fr" ? "fr-CA" : "en-CA",
      { hour: "numeric", minute: "2-digit" }
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-brand-400 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sidebar">{tr.title}</h1>
        <p className="text-sm text-brand-400 mt-0.5">{tr.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-sidebar capitalize">
              {new Date(year, month, 1).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
                month: "long", year: "numeric",
              })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 hover:text-brand-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-brand-50 text-brand-500 transition-colors"
              >
                {tr.today}
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 hover:text-brand-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {t.days.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-brand-300 py-1 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = dateStr(day);
              const count = appsOnDay(day).length;
              const isToday = ds === today;
              const isSelected = ds === selectedDate;

              return (
                <button
                  key={i}
                  onClick={() => {
                    const dow = new Date(ds + "T12:00:00").getDay();
                    if (!workingDays.includes(dow) || unavailableDays.includes(ds)) return;
                    setSelectedDate(ds === selectedDate ? null : ds);
                  }}
                  className={`relative rounded-xl p-2 min-h-[52px] text-left transition-all border-2 ${
                    isSelected ? "border-brand-400 shadow-sm shadow-brand-200" : "border-transparent"
                  } ${dayClasses(day)}`}
                >
                  <span
                    className={
                      isToday
                        ? "w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                        : "text-sm font-medium text-sidebar/80"
                    }
                  >
                    {day}
                  </span>
                  {count > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {appsOnDay(day).slice(0, 3).map((a) => (
                        <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status] ?? "bg-slate-400"}`} />
                      ))}
                      {count > 3 && <span className="text-[9px] text-brand-400">+{count - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-400">
            {Object.entries(STATUS_DOT).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1.5 capitalize">
                <span className={`w-2 h-2 rounded-full ${c}`} />
                {t.statuses[s as keyof typeof t.statuses] ?? s}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-brand-300 text-sm">{tr.selectDayHint}</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-brand-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sidebar capitalize">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                        lang === "fr" ? "fr-CA" : "en-CA",
                        { weekday: "long", month: "long", day: "numeric" }
                      )}
                    </h3>
                    <p className="text-xs text-brand-400 mt-0.5">
                      {tr.appts(selectedAppts.length)}
                    </p>
                  </div>
                  <Link href={`/admin/appointments?date=${selectedDate}`} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                    {tr.fullView}
                  </Link>
                </div>
              </div>
              {selectedAppts.length === 0 ? (
                <div className="px-5 py-8 text-center text-brand-300 text-sm">{tr.noAppointments}</div>
              ) : (
                <div className="divide-y divide-brand-50 max-h-96 overflow-y-auto">
                  {selectedAppts.map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/admin/appointments/${a.id}`}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-brand-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sidebar">{a.customer_name}</p>
                        {a.scheduled_time && (
                          <p className="text-xs text-brand-400">{fmtTime(a.scheduled_time)}</p>
                        )}
                        <p className="text-xs text-slate-400 truncate">{a.address}</p>
                      </div>
                      <span className={`ml-auto shrink-0 w-2 h-2 rounded-full mt-1.5 ${STATUS_DOT[a.status]}`} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
