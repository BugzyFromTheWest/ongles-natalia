"use client";

import { use } from "react";
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

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; date?: string; time?: string; service?: string }>;
}) {
  const { name, date, time, service } = use(searchParams);
  const { t, lang } = useLang();
  const tr = t.success;

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <GoldFlakesAnimation count={18} className="fixed inset-0 pointer-events-none z-[1]" fullWidth />
      <div className="relative z-[2] w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        {/* Gold accent */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, #FF0080, #f4c56a, #FF0080)" }} />

        <div className="p-8 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(244,197,106,0.2)", border: "2px solid rgba(244,197,106,0.5)" }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <SparkleIcon className="w-4 h-4" style={{ color: "#f4c56a" }} />
            <h1 className="text-2xl font-bold text-white">{tr.title}</h1>
            <SparkleIcon className="w-4 h-4" style={{ color: "#f4c56a" }} />
          </div>
          <p className="text-sm text-white/70 mb-8 leading-relaxed">
            {name ? `${tr.thanks}, ${name}. ` : ""}{tr.subtitle}
          </p>

          {/* Appointment details card */}
          <div className="rounded-xl p-5 text-left space-y-3.5 mb-7" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(244,197,106,0.2)", border: "1px solid rgba(244,197,106,0.4)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f4c56a" }}>{tr.date}</p>
                <p className="text-sm font-semibold text-white capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(244,197,106,0.2)", border: "1px solid rgba(244,197,106,0.4)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f4c56a" }}>{tr.time}</p>
                <p className="text-sm font-semibold text-white">{formattedTime}</p>
              </div>
            </div>
            {service && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(244,197,106,0.2)", border: "1px solid rgba(244,197,106,0.4)" }}>
                  <SparkleIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f4c56a" }}>{tr.service}</p>
                  <p className="text-sm font-semibold text-white">{service}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-white/50 mb-6 leading-relaxed px-2">{tr.note}</p>

          <a
            href="/book"
            className="inline-block w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all text-center"
            style={{ background: "linear-gradient(135deg, #ff3ebf, #ff4fd8)", boxShadow: "0 4px 20px rgba(255,62,191,0.45)" }}
          >
            {tr.bookAnother}
          </a>
        </div>
      </div>
    </div>
  );
}
