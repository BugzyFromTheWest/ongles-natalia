import { NextResponse } from 'next/server'
import { getSettings, getAppointmentsForDate } from '@/lib/db'
import { haversineKm, centroid } from '@/lib/geo'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const clientLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const hasClientCoords = clientLat !== null && clientLng !== null && !isNaN(clientLat) && !isNaN(clientLng)

  const settings = getSettings() as any
  const workingDays: number[] = JSON.parse(settings.working_days || '[1,2,3,4,5,6]')
  const unavailableDays: string[] = JSON.parse(settings.unavailable_days || '[]')
  const maxPerDay: number = settings.max_appointments_per_day || 6
  const slotDuration: number = (settings.appointment_duration_minutes || 60) + (settings.buffer_minutes || 15)
  const startTime: string = settings.working_hours_start || '09:00'
  const endTime: string = settings.working_hours_end || '17:00'
  const clusterRadiusKm: number = settings.cluster_radius_km || 25.0

  const slots: { date: string; times: string[]; available: number; area_match?: boolean }[] = []

  for (let i = 1; i <= 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay()
    const dateStr = d.toISOString().split('T')[0]

    if (!workingDays.includes(dayOfWeek)) continue
    if (unavailableDays.includes(dateStr)) continue

    const existing = getAppointmentsForDate(dateStr) as any[]
    const booked = existing.filter((a: any) => a.status !== 'cancelled')
    if (booked.length >= maxPerDay) continue

    // Geo-clustering: if client has coordinates and this day has geolocated appointments,
    // only show this day if the client is within cluster radius of the centroid
    if (hasClientCoords && booked.length > 0) {
      const geoAppts = booked.filter((a: any) => a.lat != null && a.lng != null)
      if (geoAppts.length > 0) {
        const c = centroid(geoAppts.map((a: any) => ({ lat: a.lat, lng: a.lng })))
        const dist = haversineKm(clientLat!, clientLng!, c.lat, c.lng)
        // Skip this day — client is too far from where Natalia will be
        if (dist > clusterRadiusKm) continue
      }
    }

    // Calculate available time slots
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em
    const bookedTimes = new Set(booked.map((a: any) => a.scheduled_time))
    const times: string[] = []

    for (let mins = startMins; mins + slotDuration <= endMins; mins += slotDuration) {
      const hh = String(Math.floor(mins / 60)).padStart(2, '0')
      const mm = String(mins % 60).padStart(2, '0')
      const t = `${hh}:${mm}`
      if (!bookedTimes.has(t)) times.push(t)
    }

    if (times.length > 0) {
      slots.push({ date: dateStr, times, available: times.length })
    }
  }

  return NextResponse.json(slots)
}
