import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAllAppointments, getAllServices } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appts = getAllAppointments() as any[]
  const services = getAllServices() as any[]

  // Total by status
  const byStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
  for (const a of appts) {
    if (a.status in byStatus) byStatus[a.status as keyof typeof byStatus]++
  }

  // Bookings per month (last 6 months)
  const monthMap = new Map<string, number>()
  for (const a of appts) {
    if (!a.scheduled_date) continue
    const month = a.scheduled_date.slice(0, 7)
    monthMap.set(month, (monthMap.get(month) || 0) + 1)
  }
  const months = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)

  // Most booked services
  const serviceCount = new Map<string, number>()
  for (const a of appts) {
    const name = a.service_requested || 'Unknown'
    serviceCount.set(name, (serviceCount.get(name) || 0) + 1)
  }
  const topServices = Array.from(serviceCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Busiest days of week
  const dayCount = [0, 0, 0, 0, 0, 0, 0]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (const a of appts) {
    if (!a.scheduled_date) continue
    const day = new Date(a.scheduled_date).getDay()
    dayCount[day]++
  }
  const busyDays = dayNames.map((name, i) => ({ name, count: dayCount[i] }))

  // Returning clients (booked more than once)
  const phoneCount = new Map<string, number>()
  for (const a of appts) {
    phoneCount.set(a.phone, (phoneCount.get(a.phone) || 0) + 1)
  }
  const returningClients = Array.from(phoneCount.values()).filter(c => c > 1).length
  const totalClients = phoneCount.size

  return NextResponse.json({
    total: appts.length,
    byStatus,
    months,
    topServices,
    busyDays,
    returningClients,
    totalClients,
    _servicesCount: services.length,
  })
}
