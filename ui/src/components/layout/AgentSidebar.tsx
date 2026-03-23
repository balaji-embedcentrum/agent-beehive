import { useAgentsStore } from '../../stores/agentsStore'
import { useAuthStore } from '../../stores/authStore'
import { LogOut, Settings } from 'lucide-react'

const AGENT_COLORS = [
  '#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899',
  '#06b6d4','#84cc16','#f97316','#ef4444','#a78bfa'
]
function agentColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AGENT_COLORS.length
  return AGENT_COLORS[h]
}

interface Props { onMention: (name: string) => void }

export function AgentSidebar({ onMention }: Props) {
  const agents = useAgentsStore(s => s.agents)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const online = agents.filter(a => a.is_online)
  const offline = agents.filter(a => !a.is_online)

  return (
    <div style={{
      width: 'var(--sidebar-width)', background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 22 }}>🐝</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)', letterSpacing: -0.5 }}>BeehiveHQ</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {online.length} online · {offline.length} offline
        </div>
      </div>

      {/* @all button */}
      <div style={{ padding: '8px 10px 4px', flexShrink: 0 }}>
        <button onClick={() => onMention('all')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--accent-dim)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '8px 12px', color: 'var(--accent)',
          fontWeight: 600, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>🌐</span>
          <div style={{ textAlign: 'left' }}>
            <div>@all</div>
            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-tertiary)' }}>Broadcast to everyone</div>
          </div>
        </button>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
        {online.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, padding: '10px 4px 6px' }}>
              Online — {online.length}
            </div>
            {online.map(a => <AgentRow key={a.id} agent={a} onMention={onMention} color={agentColor(a.name)} />)}
          </div>
        )}
        {offline.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, padding: '10px 4px 6px' }}>
              Offline — {offline.length}
            </div>
            {offline.map(a => <AgentRow key={a.id} agent={a} onMention={onMention} color={agentColor(a.name)} />)}
          </div>
        )}
        {agents.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px 8px', fontSize: 13 }}>
            No agents yet.<br />Add one in Manage Agents.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 12px', flexShrink: 0 }}>
        <a href="#/agents" style={{
          display: 'block', textAlign: 'center', fontSize: 12,
          color: 'var(--accent)', textDecoration: 'none', padding: '6px 0',
          borderRadius: 8, background: 'var(--accent-dim)',
          marginBottom: 8, fontWeight: 600,
        }}>
          + Manage Agents
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          }}>
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.username || 'admin'}</span>
          <button onClick={logout} title="Sign out" style={{
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            padding: 4, borderRadius: 6, display: 'flex',
          }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentRow({ agent, onMention, color }: { agent: { id: string; name: string; display_name: string; model: string; adapter: string; is_online: boolean; is_default: boolean }; onMention: (n: string) => void; color: string }) {
  return (
    <button onClick={() => onMention(agent.name)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      background: 'none', border: 'none', borderRadius: 8, padding: '7px 8px',
      cursor: 'pointer', transition: 'background var(--transition-fast)',
      textAlign: 'left',
    }}
    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
    onMouseOut={e => (e.currentTarget.style.background = 'none')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
        }}>
          {agent.display_name.charAt(0).toUpperCase()}
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1, width: 9, height: 9,
          borderRadius: '50%', border: '2px solid var(--sidebar-bg)',
          background: agent.is_online ? '#4ade80' : '#52525b',
        }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.display_name}
          </span>
          {agent.is_default && <span style={{ fontSize: 10, color: 'var(--accent)' }}>★</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.model || agent.adapter}
        </div>
      </div>
    </button>
  )
}
