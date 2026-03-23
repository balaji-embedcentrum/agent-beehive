import { useEffect, useState } from 'react'
import { useAgentsStore, type Agent } from '../../stores/agentsStore'
import { ArrowLeft, Plus, Trash2, Star } from 'lucide-react'

const AGENT_COLORS = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316']
function agentColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AGENT_COLORS.length; return AGENT_COLORS[h]
}

const emptyForm = { name: '', display_name: '', url: '', adapter: 'hermes', model: '', description: '' }

export default function AgentsPage() {
  const { agents, loadAgents, addAgent, removeAgent, setDefault } = useAgentsStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAgents() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await addAgent(form); setForm(emptyForm); setShowForm(false) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to add agent') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <a href="#/chat" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <ArrowLeft size={14} /> Back to Chat
            </a>
            <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              🐝 Agent Fleet
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Register and manage your AI agents</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13,
            border: 'none', borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={15} /> Add Agent
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-default)',
            borderRadius: 16, padding: 24, marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Register New Agent</h2>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name (slug) *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="minidobby" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Display Name *</label>
                  <input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} placeholder="Mini Dobby" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adapter URL *</label>
                  <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="http://localhost:8101" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Adapter Type</label>
                  <select value={form.adapter} onChange={e => setForm({...form, adapter: e.target.value})}>
                    <option value="hermes">Hermes</option>
                    <option value="ollama">Ollama</option>
                    <option value="openai">OpenAI-compatible</option>
                    <option value="generic">Generic HTTP</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Model (optional)</label>
                  <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="qwen3.5:35b" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description (optional)</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="General assistant" />
                </div>
              </div>
              {error && <div style={{ marginTop: 12, color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" disabled={loading} style={{
                  background: 'var(--accent)', color: '#000', fontWeight: 700,
                  border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13,
                }}>
                  {loading ? 'Adding…' : 'Add Agent'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  background: 'var(--surface-3)', color: 'var(--text-secondary)',
                  border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13,
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agent list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map(agent => (
            <div key={agent.id} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border-default)',
              borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: agentColor(agent.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff',
                }}>
                  {agent.display_name.charAt(0).toUpperCase()}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
                  borderRadius: '50%', border: '2px solid var(--surface-1)',
                  background: agent.is_online ? '#4ade80' : '#52525b',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{agent.display_name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{agent.name}</span>
                  {agent.is_default && <span style={{ fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>Default</span>}
                  <span style={{ fontSize: 11, background: agent.is_online ? 'rgba(74,222,128,0.1)' : 'rgba(82,82,91,0.3)', color: agent.is_online ? '#4ade80' : 'var(--text-tertiary)', padding: '1px 8px', borderRadius: 20 }}>
                    {agent.is_online ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agent.url} · {agent.adapter}{agent.model ? ` · ${agent.model}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!agent.is_default && (
                  <button onClick={() => setDefault(agent.name)} title="Set as default" style={{
                    background: 'none', border: '1px solid var(--border-default)',
                    borderRadius: 8, padding: '6px 12px', color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={12} /> Default
                  </button>
                )}
                <button onClick={() => { if (confirm(`Remove ${agent.name}?`)) removeAgent(agent.name) }} title="Remove" style={{
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '6px 10px', color: '#f87171', display: 'flex', alignItems: 'center',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '48px 0', fontSize: 14 }}>
              No agents registered yet. Add your first agent above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
