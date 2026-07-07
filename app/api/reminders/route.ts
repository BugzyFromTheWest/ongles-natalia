import { NextResponse } from 'next/server'
import { getAllAppointments, getSettings, expireStaleBookings } from '@/lib/db'
import { sendAppointmentReminder } from '@/lib/email'
import { sendReminderSMS } from '@/lib/sms'

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = getSettings()

  // Auto-expire stale unpaid pending bookings
  const expired = expireStaleBookings(settings.pending_expiry_hours ?? 24)

  // Send reminders for appointments tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const all = getAllAppointments() as any[]
  const upcoming = all.filter(a =>
    a.scheduled_date === tomorrowStr &&
    (a.status === 'confirmed' || a.status === 'pending')
  )

  const results = await Promise.allSettled(
    upcoming.map(appt =>
      Promise.allSettled([
        appt.email ? sendAppointmentReminder({
          to: appt.email,
          customerName: appt.customer_name,
          serviceName: appt.service_requested || 'Service',
          date: appt.scheduled_date,
          time: appt.scheduled_time,
          cancelToken: appt.cancel_token || '',
        }) : Promise.resolve(),
        sendReminderSMS({
          to: appt.phone,
          customerName: appt.customer_name,
          serviceName: appt.service_requested || 'Service',
          date: appt.scheduled_date,
          time: appt.scheduled_time,
          cancelToken: appt.cancel_token || '',
        }),
      ])
    )
  )

  return NextResponse.json({ reminders_sent: upcoming.length, expired_bookings: expired })
}
