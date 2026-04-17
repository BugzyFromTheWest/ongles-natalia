'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CancelContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleCancel() {
    if (!token) return
    setStatus('loading')
    const res = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setMessage('Your appointment has been cancelled.')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong.')
    }
  }

  if (!token) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf6f0' }}>
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
        <h1 style={{ color: '#c9a84c', marginBottom: '16px' }}>Invalid Link</h1>
        <p style={{ color: '#666' }}>This cancellation link is not valid.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf6f0' }}>
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#c9a84c', fontFamily: 'sans-serif', marginBottom: '8px' }}>Ongles Natalia</h1>
        {status === 'idle' && <>
          <h2 style={{ fontFamily: 'sans-serif', marginBottom: '16px' }}>Cancel Appointment</h2>
          <p style={{ color: '#666', marginBottom: '24px', fontFamily: 'sans-serif' }}>Are you sure you want to cancel your appointment?</p>
          <button onClick={handleCancel} style={{ background: '#c9a84c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            Yes, Cancel My Appointment
          </button>
          <br/><br/>
          <a href="/" style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontSize: '14px' }}>Keep my appointment</a>
        </>}
        {status === 'loading' && <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Cancelling...</p>}
        {status === 'success' && <>
          <p style={{ color: '#22c55e', fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '600' }}>Cancelled</p>
          <p style={{ color: '#666', fontFamily: 'sans-serif' }}>{message}</p>
          <a href="/" style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontSize: '14px' }}>Back to homepage</a>
        </>}
        {status === 'error' && <>
          <p style={{ color: '#ef4444', fontFamily: 'sans-serif' }}>{message}</p>
          <a href="/" style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontSize: '14px' }}>Back to homepage</a>
        </>}
      </div>
    </div>
  )
}

export default function CancelPage() {
  return <Suspense><CancelContent /></Suspense>
}
