import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, getSettings, updateSettings } from "@/lib/db";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcalDt(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
}

function icalEscape(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let pos = 75;
  while (pos < line.length) {
    chunks.push(" " + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join("\r\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  let settings = getSettings();

  // Auto-generate token if missing
  if (!settings.calendar_token) {
    const newToken = crypto.randomUUID().replace(/-/g, "");
    updateSettings({ calendar_token: newToken });
    settings = getSettings();
  }

  if (!token || token !== settings.calendar_token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const appointments = getAllAppointments().filter(
    (a) => a.status === "confirmed" || a.status === "pending"
  );

  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const events = appointments
    .filter((a) => a.scheduled_date && a.scheduled_time)
    .map((a) => {
      const dtStart = toIcalDt(a.scheduled_date!, a.scheduled_time!);
      const [h, m] = a.scheduled_time!.split(":").map(Number);
      const endH = h + 1;
      const dtEnd = toIcalDt(a.scheduled_date!, `${pad(endH)}:${pad(m)}`);
      const summary = `${a.service_requested} — ${a.customer_name}`;
      const desc = `${a.address}${a.phone ? ` | ${a.phone}` : ""}${a.notes ? ` | ${a.notes}` : ""}`;

      return [
        "BEGIN:VEVENT",
        foldLine(`DTSTART:${dtStart}`),
        foldLine(`DTEND:${dtEnd}`),
        foldLine(`DTSTAMP:${now}`),
        foldLine(`UID:${a.id}@onglesnatalia`),
        foldLine(`SUMMARY:${icalEscape(summary)}`),
        foldLine(`DESCRIPTION:${icalEscape(desc)}`),
        foldLine(`LOCATION:${icalEscape(a.address)}`),
        `STATUS:${a.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ongles Natalia//Booking Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Ongles Natalia",
    "X-WR-CALDESC:Appointments — Ongles Natalia Mobile Nail Studio",
    "X-WR-TIMEZONE:America/Toronto",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="natalia.ics"',
      "Cache-Control": "no-store",
    },
  });
}
