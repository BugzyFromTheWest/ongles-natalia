"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";

type ClientAppointment = {
  id: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  service_requested: string;
};

type Client = {
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  lastVisit: string | null;
  appointments: ClientAppointment[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ClientsPage() {
  const { lang, t } = useLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((d) => {
        setClients(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString(
      lang === "fr" ? "fr-CA" : "en-CA",
      { weekday: "short", month: "short", day: "numeric", year: "numeric" }
    );
  }

  function fmtTime(t: string | null) {
    if (!t) return "";
    return new Date(`2000-01-01T${t}`).toLocaleTimeString(
      lang === "fr" ? "fr-CA" : "en-CA",
      { hour: "numeric", minute: "2-digit" }
    );
  }

  function hasPending(c: Client) {
    return c.appointments.some((a) => a.status === "pending");
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sidebar">
            {lang === "fr" ? "Clients" : "Clients"}
          </h1>
          <p className="text-sm text-brand-400 mt-0.5">
            {lang === "fr"
              ? `${clients.length} client${clients.length !== 1 ? "s" : ""} au total`
              : `${clients.length} client${clients.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder={lang === "fr" ? "Rechercher par nom, téléphone ou courriel…" : "Search by name, phone or email…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 min-w-[260px] bg-white"
        />
      </div>

      {/* Client list */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-brand-300 text-sm">
            {lang === "fr" ? "Aucun client trouvé." : "No clients found."}
          </div>
        ) : (
          <div className="divide-y divide-brand-50">
            {filtered.map((c) => {
              const isExpanded = expanded === c.phone;
              return (
                <div key={c.phone}>
                  {/* Client row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : c.phone)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-brand-50/50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-brand-600">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sidebar text-sm">{c.name}</span>
                        {hasPending(c) && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                            {lang === "fr" ? "En attente" : "Pending"}
                          </span>
                        )}
                        {c.totalBookings > 1 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            {lang === "fr" ? "Client fidèle" : "Returning"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-400 mt-0.5">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-brand-300 uppercase tracking-wider">
                          {lang === "fr" ? "Réservations" : "Bookings"}
                        </p>
                        <p className="text-lg font-bold text-sidebar">{c.totalBookings}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-brand-300 uppercase tracking-wider">
                          {lang === "fr" ? "Dernière visite" : "Last Visit"}
                        </p>
                        <p className="text-xs text-brand-500 capitalize">{fmtDate(c.lastVisit)}</p>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 text-brand-300 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded: appointment list */}
                  {isExpanded && (
                    <div className="bg-brand-50/40 border-t border-brand-100 px-5 py-4 space-y-2">
                      <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        {lang === "fr" ? "Historique des rendez-vous" : "Appointment History"}
                      </p>
                      {c.appointments
                        .sort((a, b) => (b.scheduled_date ?? "").localeCompare(a.scheduled_date ?? ""))
                        .map((appt) => (
                          <div key={appt.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-brand-100">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-sidebar truncate">{appt.service_requested}</p>
                              <p className="text-xs text-brand-400 capitalize mt-0.5">
                                {appt.scheduled_date ? fmtDate(appt.scheduled_date) : "—"}
                                {appt.scheduled_time ? ` · ${fmtTime(appt.scheduled_time)}` : ""}
                              </p>
                            </div>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_COLORS[appt.status] ?? "bg-slate-100 text-slate-600"}`}>
                              {t.statuses[appt.status as keyof typeof t.statuses] ?? appt.status}
                            </span>
                            <Link
                              href={`/admin/appointments/${appt.id}`}
                              className="text-brand-500 hover:text-brand-700 text-xs font-semibold shrink-0"
                            >
                              {lang === "fr" ? "Voir" : "View"}
                            </Link>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-brand-300">
        {lang === "fr"
          ? `${filtered.length} client${filtered.length !== 1 ? "s" : ""}`
          : `${filtered.length} client${filtered.length !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
