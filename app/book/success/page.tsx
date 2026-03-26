"use client";

import { use } from "react";
import { useLang } from "@/components/LangProvider";

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #7b2d55 0%, #4a1835 60%, #2a1020 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Gold accent */}
        <div className="h-1 bg-gradient-to-r from-brand-400 via-gold-400 to-brand-300" />

        <div className="p-8 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <SparkleIcon className="w-4 h-4 text-gold-400" />
            <h1 className="text-2xl font-bold text-sidebar">{tr.title}</h1>
            <SparkleIcon className="w-4 h-4 text-gold-400" />
          </div>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            {name ? `${tr.thanks}, ${name}. ` : ""}{tr.subtitle}
          </p>

          {/* Appointment details card */}
          <div className="bg-brand-50 rounded-xl p-5 text-left space-y-3.5 mb-7 border border-brand-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest mb-0.5">{tr.date}</p>
                <p className="text-sm font-semibold text-sidebar capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest mb-0.5">{tr.time}</p>
                <p className="text-sm font-semibold text-sidebar">{formattedTime}</p>
              </div>
            </div>
            {service && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <SparkleIcon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest mb-0.5">{tr.service}</p>
                  <p className="text-sm font-semibold text-sidebar">{service}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed px-2">{tr.note}</p>

          <a
            href="/book"
            className="inline-block w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-300/30 text-center"
          >
            {tr.bookAnother}
          </a>
        </div>
      </div>
    </div>
  );
}
