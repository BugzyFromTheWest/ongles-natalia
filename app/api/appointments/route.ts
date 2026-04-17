import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, createAppointment, getAppointmentsForDate } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";
import { findBestDate } from "@/lib/scheduling";
import { getSession } from "@/lib/auth";
import { sendBookingConfirmation, sendAdminNewBookingAlert } from "@/lib/email";
import { sendBookingSMS, sendAdminNewBookingSMS } from "@/lib/sms";

// Simple in-memory rate limit: max 3 bookings per IP per hour
const rateLimitMap = new Map<string, { count: number; reset: number }>();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  let appointments = date
    ? getAppointmentsForDate(date)
    : getAllAppointments();

  if (status) appointments = appointments.filter((a) => a.status === status);

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const now = Date.now();
    const limit = rateLimitMap.get(ip);
    if (limit) {
      if (now < limit.reset && limit.count >= 3) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      if (now > limit.reset) rateLimitMap.set(ip, { count: 1, reset: now + 3600000 });
      else limit.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, reset: now + 3600000 });
    }

    const body = await req.json();
    const { customer_name, phone, email, address, service_requested, service_id, notes } = body;

    if (!customer_name || !phone || !email || !address || !service_requested) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cancelToken = crypto.randomUUID();
    const coords = await geocodeAddress(address);
    const { date, time } = findBestDate(coords?.lat ?? null, coords?.lng ?? null);

    const appointment = createAppointment({
      customer_name,
      phone,
      email,
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      service_requested,
      service_id: service_id ?? null,
      total_price: null,
      notes: notes ?? "",
      status: "pending",
      scheduled_date: date,
      scheduled_time: time,
      cancel_token: cancelToken,
    });

    // Fire notifications in parallel — failures don't break booking
    const serviceName = appointment.service_requested || "Service";
    const notifyOpts = {
      customerName: appointment.customer_name,
      phone: appointment.phone,
      serviceName,
      date: appointment.scheduled_date ?? "",
      time: appointment.scheduled_time ?? "",
      address: appointment.address,
      cancelToken,
    };

    Promise.allSettled([
      appointment.email
        ? sendBookingConfirmation({
            to: appointment.email,
            customerName: appointment.customer_name,
            serviceName,
            date: appointment.scheduled_date ?? "",
            time: appointment.scheduled_time ?? "",
            cancelToken,
          })
        : Promise.resolve(),
      sendBookingSMS({
        to: appointment.phone,
        customerName: appointment.customer_name,
        serviceName,
        date: appointment.scheduled_date ?? "",
        time: appointment.scheduled_time ?? "",
        cancelToken,
      }),
      sendAdminNewBookingAlert(notifyOpts),
      sendAdminNewBookingSMS(notifyOpts),
    ]).catch(() => {});

    return NextResponse.json(appointment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
