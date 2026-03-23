import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const login = useAuthStore(s => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(username, password)
      window.location.hash = '/chat'
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🐝</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1 }}>BeehiveHQ</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Universal AI Agent Group Chat</p>
        </div>
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          borderRadius: 16, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Sign in to your Hive</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              background: loading ? 'rgba(245,158,11,0.5)' : 'var(--accent)',
              color: '#000', fontWeight: 700, fontSize: 15, padding: '12px 0',
              border: 'none', borderRadius: 10, transition: 'background var(--transition-fast)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Signing in…' : 'Enter the Hive →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, marginTop: 24 }}>
          BeehiveHQ — Open Source · Self-Hosted · Framework-Agnostic
        </p>
      </div>
    </div>
  )
}
