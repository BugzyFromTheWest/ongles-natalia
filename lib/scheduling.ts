import { getAppointmentsForDate, getSettings, type Settings } from "./db";
import { haversineKm, centroid } from "./geo";

export type ScheduleResult = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
};

function isWorkingDay(date: Date, settings: Settings): boolean {
  const workingDays: number[] = JSON.parse(settings.working_days);
  return workingDays.includes(date.getDay());
}

function isUnavailableDay(date: Date, settings: Settings): boolean {
  const unavailable: string[] = JSON.parse(settings.unavailable_days);
  return unavailable.includes(formatDate(date));
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function maxSlots(settings: Settings): number {
  const start = timeToMinutes(settings.working_hours_start);
  const end = timeToMinutes(settings.working_hours_end);
  const slotSize =
    settings.appointment_duration_minutes + settings.buffer_minutes;
  const byTime = Math.floor((end - start) / slotSize);
  return Math.min(settings.max_appointments_per_day, byTime);
}

function nextTimeSlot(dateStr: string, settings: Settings): string | null {
  const apps = getAppointmentsForDate(dateStr);
  const start = timeToMinutes(settings.working_hours_start);
  const end = timeToMinutes(settings.working_hours_end);
  const slotSize =
    settings.appointment_duration_minutes + settings.buffer_minutes;
  const slotStart = start + apps.length * slotSize;
  if (slotStart + settings.appointment_duration_minutes > end) return null;
  return minutesToTime(slotStart);
}

type DayScore = {
  date: string;
  score: number; // km to centroid; Infinity = no existing appointments
  count: number;
};

export function findBestDate(
  lat: number | null,
  lng: number | null
): ScheduleResult {
  const settings = getSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates: DayScore[] = [];
  const maxPerDay = maxSlots(settings);

  for (let i = 1; i <= 90; i++) {
    const date = addDays(today, i);
    if (!isWorkingDay(date, settings)) continue;
    if (isUnavailableDay(date, settings)) continue;

    const dateStr = formatDate(date);
    const apps = getAppointmentsForDate(dateStr);
    if (apps.length >= maxPerDay) continue;

    const geoApps = apps.filter((a) => a.lat !== null && a.lng !== null);

    let score = Infinity;
    if (lat !== null && lng !== null && geoApps.length > 0) {
      const c = centroid(geoApps.map((a) => ({ lat: a.lat!, lng: a.lng! })));
      score = haversineKm(lat, lng, c.lat, c.lng);
    }

    candidates.push({ date: dateStr, score, count: apps.length });
  }

  // Emergency fallback — no working days found in 90 days
  if (candidates.length === 0) {
    for (let i = 1; i <= 7; i++) {
      candidates.push({
        date: formatDate(addDays(today, i)),
        score: Infinity,
        count: 0,
      });
    }
  }

  let bestDate: string;

  if (lat !== null && lng !== null) {
    const radius = settings.cluster_radius_km;

    // Days with existing nearby appointments (within cluster radius)
    const nearby = candidates
      .filter((d) => d.score !== Infinity && d.score <= radius)
      .sort((a, b) => a.score - b.score || b.count - a.count);

    if (nearby.length > 0) {
      bestDate = nearby[0].date;
    } else {
      // No nearby cluster day — use the day with closest existing appointments
      const withApps = candidates
        .filter((d) => d.score !== Infinity)
        .sort((a, b) => a.score - b.score);

      bestDate = withApps.length > 0 ? withApps[0].date : candidates[0].date;
    }
  } else {
    // No coords — use the most-booked available day (to pack schedule), else first available
    const withApps = candidates
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
    bestDate = withApps.length > 0 ? withApps[0].date : candidates[0].date;
  }

  const time = nextTimeSlot(bestDate, settings) ?? settings.working_hours_start;
  return { date: bestDate, time };
}
