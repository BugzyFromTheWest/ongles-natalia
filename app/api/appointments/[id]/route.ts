import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsForDate,
  getSettings,
} from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";
import { getSession } from "@/lib/auth";

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const appt = getAppointmentById(id);
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appt);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = getAppointmentById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Re-geocode if address changed
  let lat = existing.lat;
  let lng = existing.lng;
  if (body.address && body.address !== existing.address) {
    const coords = await geocodeAddress(body.address);
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
  }

  // Recalculate time slot if date changed
  let scheduled_time = body.scheduled_time ?? existing.scheduled_time;
  if (body.scheduled_date && body.scheduled_date !== existing.scheduled_date) {
    const settings = getSettings();
    const appsOnDay = getAppointmentsForDate(body.scheduled_date).filter(
      (a) => a.id !== id
    );
    const start = timeToMin(settings.working_hours_start);
    const end = timeToMin(settings.working_hours_end);
    const slotSize = settings.appointment_duration_minutes + settings.buffer_minutes;
    const slotStart = start + appsOnDay.length * slotSize;
    scheduled_time =
      slotStart + settings.appointment_duration_minutes <= end
        ? minToTime(slotStart)
        : settings.working_hours_start;
  }

  const updated = updateAppointment(id, { ...body, lat, lng, scheduled_time });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  deleteAppointment(id);
  return NextResponse.json({ ok: true });
}
