import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const db = getDb()
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(session.userId) as any
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = bcrypt.compareSync(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const hash = bcrypt.hashSync(newPassword, 12)
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, session.userId)

  return NextResponse.json({ ok: true })
}
