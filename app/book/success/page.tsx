"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/components/LangProvider";

const GoldFlakesAnimation = dynamic(() => import("@/components/GoldFlakesAnimation"), { ssr: false });

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" />
    </svg>
  );
}

function generateIcs(opts: {
  date: string; time: string; service: string; name: string; lang: string;
}): string {
  const [year, month, day] = opts.date.split("-").map(Number);
  const [hour, minute] = opts.time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endHour = hour + 1;
  const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`;
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const summary = `${opts.service} — Ongles Natalia`;
  const desc = opts.lang === "fr"
    ? `Rendez-vous avec Natalia. Contact: onglesnatalia@gmail.com | +1 514-652-6284`
    : `Appointment with Natalia. Contact: onglesnatalia@gmail.com | +1 514-652-6284`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ongles Natalia//Mobile Nail Studio//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    "ORGANIZER;CN=Ongles Natalia:mailto:onglesnatalia@gmail.com",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(opts: { date: string; time: string; service: string; name: string; lang: string }) {
  const ics = generateIcs(opts);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ongles-natalia-appointment.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; date?: string; time?: string; service?: string }>;
}) {
  const { name = "", date = "", time = "", service = "" } = use(searchParams);
  const { t, lang } = useLang();
  const tr = t.success;
  const [visible, setVisible] = useState(false);
  const [calAdded, setCalAdded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString(
        lang === "fr" ? "fr-CA" : "en-CA",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      )
    : "TBD";

  const formattedTime = time
    ? new Date(`2000-01-01T${time}`).toLocaleTimeString(
        lang === "fr" ? "fr-CA" : "en-CA",
        { hour: "numeric", minute: "2-digit" }
      )
    : "TBD";

  function handleAddToCalendar() {
    if (!date || !time) return;
    downloadIcs({ date, time, service, name, lang });
    setCalAdded(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <GoldFlakesAnimation count={11} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />

      <div
        className="relative z-[2] w-full max-w-sm transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
        }}
      >
        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.09)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}>

          {/* Shimmer top line */}
          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #7a0a48 20%, #f4c56a 50%, #7a0a48 80%, transparent)" }} />

          <div className="p-7 text-center">

            {/* Animated checkmark */}
            <div className="relative mx-auto mb-6" style={{ width: 72, height: 72 }}>
              <div className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(244,197,106,0.2) 0%, transparent 70%)",
                  animation: "floatPulse 2.5s ease-in-out infinite",
                }} />
              <div className="relative w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(244,197,106,0.25) 0%, rgba(160,16,96,0.2) 100%)",
                  border: "1.5px solid rgba(244,197,106,0.45)",
                  boxShadow: "0 0 0 6px rgba(244,197,106,0.08)",
                }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span style={{ color: "#f4c56a" }}><SparkleIcon className="w-3.5 h-3.5" /></span>
              <h1 className="text-xl font-bold text-white tracking-tight">{tr.title}</h1>
              <span style={{ color: "#f4c56a" }}><SparkleIcon className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {name ? `${tr.thanks}, ${name}.` : ""} {tr.subtitle}
            </p>

            {/* Appointment details */}
            <div className="rounded-2xl p-4 text-left space-y-3 mb-5"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}>
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                  label: tr.date,
                  value: <span className="capitalize">{formattedDate}</span>,
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  label: tr.time,
                  value: formattedTime,
                },
                ...(service ? [{
                  icon: <path d="M12 2l1.8 6.2 6.2 1.8-6.2 1.8L12 18l-1.8-6.2L4 9.8l6.2-1.8z" />,
                  label: tr.service,
                  value: service,
                  fill: true,
                }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(244,197,106,0.12)", border: "1px solid rgba(244,197,106,0.25)" }}>
                    <svg className="w-3.5 h-3.5 text-white/70" fill={item.fill ? "currentColor" : "none"} viewBox="0 0 24 24" stroke={item.fill ? undefined : "currentColor"}>
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(244,197,106,0.7)" }}>{item.label}</p>
                    <p className="text-sm font-semibold text-white/90">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-white/35 mb-5 px-1 leading-relaxed">{tr.note}</p>

            {/* Add to Calendar CTA */}
            {date && time && (
              <button
                onClick={handleAddToCalendar}
                className="btn-press w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm mb-3 transition-all"
                style={calAdded ? {
                  background: "rgba(244,197,106,0.12)",
                  border: "1px solid rgba(244,197,106,0.3)",
                  color: "#f4c56a",
                } : {
                  background: "linear-gradient(135deg, #f4c56a 0%, #e8b050 100%)",
                  color: "#3a0e00",
                  boxShadow: "0 4px 20px rgba(244,197,106,0.3)",
                }}>
                {calAdded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {lang === "fr" ? "Ajouté au calendrier" : "Added to calendar"}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {lang === "fr" ? "Ajouter au calendrier" : "Add to Calendar"}
                  </>
                )}
              </button>
            )}

            {/* Secondary CTA */}
            <Link
              href="/book"
              className="btn-press w-full flex items-center justify-center py-3 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              {tr.bookAnother}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/25 text-[10px] mt-5 tracking-wide">
          Ongles Natalia · Mobile Nail Studio · Montréal
        </p>
      </div>
    </div>
  );
}
