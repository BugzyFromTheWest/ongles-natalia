import { NextResponse } from 'next/server'
import { getAppointmentByCancelToken, updateAppointment } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

    const appointment = getAppointmentByCancelToken(token) as any
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    if (appointment.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    if (appointment.status === 'completed') return NextResponse.json({ error: 'Cannot cancel completed appointment' }, { status: 400 })

    updateAppointment(appointment.id, { status: 'cancelled' })
    return NextResponse.json({ ok: true, appointment })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
