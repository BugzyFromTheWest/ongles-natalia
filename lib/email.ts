import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = 'Ongles Natalia <bookings@onglesnatalia.ca>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function sendBookingConfirmation(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  cancelToken: string
  lang?: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const fr = opts.lang === 'fr'
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`
  const subject = fr
    ? `Confirmation de votre rendez-vous — Ongles Natalia`
    : `Appointment Confirmation — Ongles Natalia`
  const html = fr ? `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#c9a84c">Ongles Natalia</h2>
      <p>Bonjour <strong>${opts.customerName}</strong>,</p>
      <p>Votre rendez-vous a été reçu et sera confirmé sous peu.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Service</td><td style="padding:8px;border:1px solid #eee">${opts.serviceName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Date</td><td style="padding:8px;border:1px solid #eee">${opts.date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Heure</td><td style="padding:8px;border:1px solid #eee">${opts.time}</td></tr>
      </table>
      <p>Besoin d'annuler ? <a href="${cancelUrl}" style="color:#c9a84c">Cliquez ici pour annuler votre rendez-vous</a></p>
      <p style="color:#888;font-size:13px">Merci de nous avoir choisi !</p>
    </div>` : `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#c9a84c">Ongles Natalia</h2>
      <p>Hi <strong>${opts.customerName}</strong>,</p>
      <p>Your appointment has been received and will be confirmed shortly.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Service</td><td style="padding:8px;border:1px solid #eee">${opts.serviceName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Date</td><td style="padding:8px;border:1px solid #eee">${opts.date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Time</td><td style="padding:8px;border:1px solid #eee">${opts.time}</td></tr>
      </table>
      <p>Need to cancel? <a href="${cancelUrl}" style="color:#c9a84c">Click here to cancel your appointment</a></p>
      <p style="color:#888;font-size:13px">Thank you for choosing us!</p>
    </div>`
  await resend.emails.send({ from: FROM, to: opts.to, subject, html })
}

export async function sendAppointmentReminder(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  cancelToken: string
  lang?: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const fr = opts.lang === 'fr'
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`
  const subject = fr
    ? `Rappel : votre rendez-vous demain — Ongles Natalia`
    : `Reminder: your appointment tomorrow — Ongles Natalia`
  const html = fr ? `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#c9a84c">Ongles Natalia</h2>
      <p>Bonjour <strong>${opts.customerName}</strong>,</p>
      <p>Rappel : vous avez un rendez-vous <strong>demain</strong>.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Service</td><td style="padding:8px;border:1px solid #eee">${opts.serviceName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Date</td><td style="padding:8px;border:1px solid #eee">${opts.date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Heure</td><td style="padding:8px;border:1px solid #eee">${opts.time}</td></tr>
      </table>
      <p>Besoin d'annuler ? <a href="${cancelUrl}" style="color:#c9a84c">Annuler mon rendez-vous</a></p>
    </div>` : `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#c9a84c">Ongles Natalia</h2>
      <p>Hi <strong>${opts.customerName}</strong>,</p>
      <p>Reminder: you have an appointment <strong>tomorrow</strong>.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Service</td><td style="padding:8px;border:1px solid #eee">${opts.serviceName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Date</td><td style="padding:8px;border:1px solid #eee">${opts.date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Time</td><td style="padding:8px;border:1px solid #eee">${opts.time}</td></tr>
      </table>
      <p>Need to cancel? <a href="${cancelUrl}" style="color:#c9a84c">Cancel my appointment</a></p>
    </div>`
  await resend.emails.send({ from: FROM, to: opts.to, subject, html })
}

export async function sendAdminNewBookingAlert(opts: {
  customerName: string
  phone: string
  serviceName: string
  date: string
  time: string
  address: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) { console.warn('[email] ADMIN_EMAIL not set — skipping admin alert'); return }
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Booking — ${opts.customerName} — ${opts.date} ${opts.time}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#c9a84c">New Booking Received</h2>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Client</td><td style="padding:8px;border:1px solid #eee">${opts.customerName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Phone</td><td style="padding:8px;border:1px solid #eee">${opts.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Service</td><td style="padding:8px;border:1px solid #eee">${opts.serviceName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Date</td><td style="padding:8px;border:1px solid #eee">${opts.date}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Time</td><td style="padding:8px;border:1px solid #eee">${opts.time}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600">Address</td><td style="padding:8px;border:1px solid #eee">${opts.address}</td></tr>
        </table>
      </div>`
  })
}
