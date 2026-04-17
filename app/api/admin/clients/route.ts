import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllAppointments } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appts = getAllAppointments() as any[]

  // Group by phone number
  const clientMap = new Map<string, any>()
  for (const a of appts) {
    const existing = clientMap.get(a.phone)
    if (!existing) {
      clientMap.set(a.phone, {
        name: a.customer_name,
        phone: a.phone,
        email: a.email,
        appointments: [a],
        lastVisit: a.scheduled_date,
        totalBookings: 1,
      })
    } else {
      existing.appointments.push(a)
      existing.totalBookings++
      if (a.scheduled_date > existing.lastVisit) {
        existing.lastVisit = a.scheduled_date
        existing.name = a.customer_name
      }
    }
  }

  const clients = Array.from(clientMap.values())
    .sort((a, b) => b.totalBookings - a.totalBookings)

  return NextResponse.json(clients)
}
