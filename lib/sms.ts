import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  return twilio(sid, token)
}

const FROM = process.env.TWILIO_PHONE_NUMBER || ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function sendBookingSMS(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  cancelToken: string
  lang?: string
}) {
  const client = getClient()
  if (!client || !FROM) { console.warn('[sms] Twilio not configured — skipping'); return }
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`
  const fr = opts.lang === 'fr'
  const body = fr
    ? `Ongles Natalia: Bonjour ${opts.customerName}, votre RDV est prévu le ${opts.date} à ${opts.time} (${opts.serviceName}). Annuler: ${cancelUrl}`
    : `Ongles Natalia: Hi ${opts.customerName}, your appointment is scheduled for ${opts.date} at ${opts.time} (${opts.serviceName}). Cancel: ${cancelUrl}`
  await client.messages.create({ body, from: FROM, to: opts.to })
}

export async function sendReminderSMS(opts: {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  cancelToken: string
  lang?: string
}) {
  const client = getClient()
  if (!client || !FROM) { console.warn('[sms] Twilio not configured — skipping'); return }
  const cancelUrl = `${BASE_URL}/book/cancel?token=${opts.cancelToken}`
  const fr = opts.lang === 'fr'
  const body = fr
    ? `Ongles Natalia: Rappel — votre RDV est demain ${opts.date} à ${opts.time} (${opts.serviceName}). Annuler: ${cancelUrl}`
    : `Ongles Natalia: Reminder — your appointment is tomorrow ${opts.date} at ${opts.time} (${opts.serviceName}). Cancel: ${cancelUrl}`
  await client.messages.create({ body, from: FROM, to: opts.to })
}

export async function sendAdminNewBookingSMS(opts: {
  customerName: string
  phone: string
  serviceName: string
  date: string
  time: string
}) {
  const client = getClient()
  if (!client || !FROM) { console.warn('[sms] Twilio not configured — skipping'); return }
  const adminPhone = process.env.ADMIN_PHONE
  if (!adminPhone) { console.warn('[sms] ADMIN_PHONE not set — skipping admin SMS'); return }
  const body = `New booking: ${opts.customerName} (${opts.phone}) — ${opts.serviceName} on ${opts.date} at ${opts.time}`
  await client.messages.create({ body, from: FROM, to: adminPhone })
}
