import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Ongles Natalia <bookings@onglesnatalia.ca>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// ── Shared layout ─────────────────────────────────────────────────────────────

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ongles Natalia</title></head>
<body style="margin:0;padding:0;background:#1a0010;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0010;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.5);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6b0f3a 0%,#a01060 50%,#7a0a48 100%);padding:32px 40px;text-align:center;">
          <div style="width:56px;height:56px;border-radius:14px;overflow:hidden;margin:0 auto 14px;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
            <img src="${BASE_URL}/On.png" alt="ON" width="56" height="56" style="display:block;width:100%;height:100%;object-fit:cover;" />
          </div>
          <p style="margin:0;color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Mobile Nail Studio &middot; Montr&eacute;al</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#2a0520;padding:36px 40px;">
          ${content}
        </td></tr>

        <!-- Policy footer -->
        <tr><td style="background:#1f0318;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 6px;color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Politique d&apos;annulation &middot; Cancellation Policy</p>
          <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;line-height:1.6;">
            Toute annulation dans les 24 heures pr&eacute;c&eacute;dant le rendez-vous ne sera pas rembours&eacute;e.<br/>
            Cancellations within 24 hours of the appointment are non-refundable.
          </p>
        </td></tr>

        <!-- Brand footer -->
        <tr><td style="background:#160214;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;color:rgba(255,255,255,0.25);font-size:11px;">+1 514-652-6284 &middot; onglesnatalia@gmail.com</p>
          <p style="margin:0;color:rgba(255,255,255,0.15);font-size:10px;">&copy; 2026 Ongles Natalia. Tous droits r&eacute;serv&eacute;s.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 14px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.06);">${label}</td>
    <td style="padding:10px 14px;font-size:13px;color:rgba(255,255,255,0.85);border-bottom:1px solid rgba(255,255,255,0.06);">${value}</td>
  </tr>`
}

function goldButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#f4c56a,#e8b050);color:#3a0e00;font-weight:700;font-size:13px;padding:13px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.04em;">${label}</a>`
}

function ghostButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;color:rgba(255,255,255,0.4);font-size:12px;padding:10px 0;text-decoration:underline;">${label}</a>`
}

// ── Booking confirmation ──────────────────────────────────────────────────────

export async function sendBookingConfirmation(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  address?: string
  duration?: string
  notes?: string
  cancelToken: string
  lang?: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const fr = opts.lang === 'fr'
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`

  const subject = fr
    ? `Votre demande a \u00e9t\u00e9 re\u00e7ue \u2014 Ongles Natalia`
    : `Booking received \u2014 Ongles Natalia`

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#fff;">
      ${fr ? `Bonjour, ${opts.customerName} \u2736` : `Hi ${opts.customerName} \u2736`}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
      ${fr
        ? 'Votre demande de rendez-vous a bien \u00e9t\u00e9 re\u00e7ue. Natalia vous confirmera sous peu.'
        : 'Your appointment request has been received. Natalia will confirm with you shortly.'}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);margin-bottom:24px;">
      ${detailRow(fr ? 'Service' : 'Service', opts.serviceName)}
      ${detailRow(fr ? 'Date' : 'Date', opts.date)}
      ${detailRow(fr ? 'Heure' : 'Time', opts.time)}
      ${opts.address ? detailRow(fr ? 'Adresse' : 'Address', opts.address) : ''}
      ${opts.duration ? detailRow(fr ? 'Dur\u00e9e estim\u00e9e' : 'Est. duration', opts.duration) : ''}
      ${opts.notes ? detailRow(fr ? 'Notes' : 'Notes', opts.notes) : ''}
    </table>

    <div style="text-align:center;margin-bottom:16px;">
      ${goldButton(`${BASE_URL}/book`, fr ? '\u2736 R\u00e9server un autre rendez-vous' : '\u2736 Book another appointment')}
    </div>
    <div style="text-align:center;">
      ${ghostButton(cancelUrl, fr ? 'Annuler ce rendez-vous' : 'Cancel this appointment')}
    </div>
  `

  await resend.emails.send({ from: FROM, to: opts.to, subject, html: emailShell(body) })
}

// ── Appointment reminder ──────────────────────────────────────────────────────

export async function sendAppointmentReminder(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  address?: string
  cancelToken: string
  lang?: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const fr = opts.lang === 'fr'
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`

  const subject = fr
    ? `Rappel\u00a0: rendez-vous demain \u2014 Ongles Natalia`
    : `Reminder: appointment tomorrow \u2014 Ongles Natalia`

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#fff;">
      ${fr ? `\u00c0 demain, ${opts.customerName} \u2736` : `See you tomorrow, ${opts.customerName} \u2736`}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
      ${fr ? 'Voici un rappel pour votre rendez-vous de demain.' : "Here's a reminder for your appointment tomorrow."}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);margin-bottom:24px;">
      ${detailRow(fr ? 'Service' : 'Service', opts.serviceName)}
      ${detailRow(fr ? 'Date' : 'Date', opts.date)}
      ${detailRow(fr ? 'Heure' : 'Time', opts.time)}
      ${opts.address ? detailRow(fr ? 'Adresse' : 'Address', opts.address) : ''}
    </table>

    <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;">
      ${fr
        ? '\u26a0\ufe0f Rappel\u00a0: toute annulation dans les 24 heures n\u2019est pas remboursable.'
        : '\u26a0\ufe0f Reminder: cancellations within 24 hours are non-refundable.'}
    </p>
    <div style="text-align:center;">
      ${ghostButton(cancelUrl, fr ? 'Annuler quand m\u00eame' : 'Cancel anyway')}
    </div>
  `

  await resend.emails.send({ from: FROM, to: opts.to, subject, html: emailShell(body) })
}

// ── Admin new booking alert ───────────────────────────────────────────────────

export async function sendAdminNewBookingAlert(opts: {
  customerName: string
  phone: string
  serviceName: string
  date: string
  time: string
  address: string
  cancelToken?: string
  notes?: string
}) {
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping'); return }
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) { console.warn('[email] ADMIN_EMAIL not set — skipping admin alert'); return }

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#fff;">Nouvelle r\u00e9servation \u2736</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6);">New booking received &mdash; action may be required.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);margin-bottom:24px;">
      ${detailRow('Client', opts.customerName)}
      ${detailRow('Phone', opts.phone)}
      ${detailRow('Service', opts.serviceName)}
      ${detailRow('Date', opts.date)}
      ${detailRow('Time', opts.time)}
      ${detailRow('Address', opts.address)}
      ${opts.notes ? detailRow('Notes', opts.notes) : ''}
    </table>

    <div style="text-align:center;">
      ${goldButton(`${BASE_URL}/admin/appointments`, 'View in Admin \u2192')}
    </div>
  `

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `\ud83d\udcc5 New booking \u2014 ${opts.customerName} \u2014 ${opts.date} ${opts.time}`,
    html: emailShell(body),
  })
}
