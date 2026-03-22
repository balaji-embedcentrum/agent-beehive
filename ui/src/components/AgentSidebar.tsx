import { Agent } from '@/types'

interface Props {
  agents: Agent[]
  onMention: (name: string) => void
}

export default function AgentSidebar({ agents, onMention }: Props) {
  const online = agents.filter(a => a.is_online)
  const offline = agents.filter(a => !a.is_online)

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agents</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* @all button */}
        <button
          onClick={() => onMention('all')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition text-left"
        >
          <span className="text-xl">🌐</span>
          <div>
            <div className="text-sm font-medium text-gray-200">@all</div>
            <div className="text-xs text-gray-500">Broadcast to everyone</div>
          </div>
        </button>

        <div className="border-t border-gray-800 my-2" />

        {/* Online agents */}
        {online.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
              Online — {online.length}
            </div>
            {online.map(agent => (
              <AgentRow key={agent.id} agent={agent} onMention={onMention} />
            ))}
          </div>
        )}

        {/* Offline agents */}
        {offline.length > 0 && (
          <div>
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
              Offline — {offline.length}
            </div>
            {offline.map(agent => (
              <AgentRow key={agent.id} agent={agent} onMention={onMention} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800">
        <a
          href="/agents"
          className="block w-full text-center text-xs text-yellow-400 hover:text-yellow-300 transition"
        >
          + Manage Agents
        </a>
      </div>
    </div>
  )
}

function AgentRow({ agent, onMention }: { agent: Agent; onMention: (n: string) => void }) {
  return (
    <button
      onClick={() => onMention(agent.name)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
          {agent.display_name.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900
          ${agent.is_online ? 'bg-green-400' : 'bg-gray-600'}`}
        />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">{agent.display_name}</div>
        <div className="text-xs text-gray-500 truncate">{agent.model || agent.adapter}</div>
      </div>
      {agent.is_default && (
        <span className="ml-auto text-xs text-yellow-500">★</span>
      )}
    </button>
  )
}
