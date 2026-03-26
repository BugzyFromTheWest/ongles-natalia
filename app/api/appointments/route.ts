import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, createAppointment, getAppointmentsForDate } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";
import { findBestDate } from "@/lib/scheduling";
import { getSession } from "@/lib/auth";

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
    const body = await req.json();
    const { customer_name, phone, email, address, service_requested, service_id, notes } = body;

    if (!customer_name || !phone || !email || !address || !service_requested) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
