'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Agent, User } from '@/types'
import { isAuthenticated } from '@/lib/auth'

export default function AgentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', display_name: '', url: '', adapter: 'ollama', model: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return }
    api.me().then(setUser).catch(() => router.push('/'))
    loadAgents()
  }, [router])

  const loadAgents = async () => {
    const list = await api.listAgents()
    setAgents(list)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.addAgent(form)
      setShowForm(false)
      setForm({ name: '', display_name: '', url: '', adapter: 'ollama', model: '', description: '' })
      await loadAgents()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove agent ${name}?`)) return
    await api.removeAgent(name)
    await loadAgents()
  }

  const handleSetDefault = async (name: string) => {
    await api.setDefaultAgent(name)
    await loadAgents()
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/chat" className="text-yellow-400 hover:text-yellow-300 text-sm mb-2 inline-block">← Back to Chat</a>
            <h1 className="text-2xl font-bold text-gray-100">🐝 Agent Management</h1>
            <p className="text-gray-400 text-sm mt-1">Register and manage your AI agent fleet</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition"
          >
            + Add Agent
          </button>
        </div>

        {/* Add Agent Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Register New Agent</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name (slug)</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="minidobby" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                <input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})}
                  placeholder="Mini Dobby" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Adapter URL</label>
                <input value={form.url} onChange={e => setForm({...form, url: e.target.value})}
                  placeholder="http://localhost:8101" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Adapter Type</label>
                <select value={form.adapter} onChange={e => setForm({...form, adapter: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500">
                  <option value="ollama">Ollama</option>
                  <option value="hermes">Hermes</option>
                  <option value="openai">OpenAI-compatible</option>
                  <option value="generic">Generic HTTP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Model (optional)</label>
                <input value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                  placeholder="qwen3.5:35b"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="General assistant"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-yellow-500" />
              </div>
              {error && <div className="col-span-2 text-red-400 text-sm">{error}</div>}
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-6 py-2 rounded-lg transition disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Agent'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agent List */}
        <div className="space-y-3">
          {agents.map(agent => (
            <div key={agent.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                  {agent.display_name.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-900
                  ${agent.is_online ? 'bg-green-400' : 'bg-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-100">{agent.display_name}</span>
                  <span className="text-xs text-gray-500">@{agent.name}</span>
                  {agent.is_default && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Default</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${agent.is_online ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                    {agent.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-0.5 truncate">
                  {agent.url} · {agent.adapter} {agent.model ? `· ${agent.model}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!agent.is_default && (
                  <button onClick={() => handleSetDefault(agent.name)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 px-3 py-1.5 border border-yellow-500/30 rounded-lg transition">
                    Set Default
                  </button>
                )}
                <button onClick={() => handleRemove(agent.name)}
                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 rounded-lg transition">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No agents registered yet. Add your first agent above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
