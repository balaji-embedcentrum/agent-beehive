-- SwarmHQ Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent registry
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) UNIQUE NOT NULL,         -- e.g. "minidobby"
    display_name VARCHAR(128) NOT NULL,        -- e.g. "Mini Dobby"
    url TEXT NOT NULL,                         -- e.g. "http://agent-minidobby:8101"
    adapter VARCHAR(32) NOT NULL DEFAULT 'generic', -- hermes|ollama|openai|generic
    model VARCHAR(128),                        -- e.g. "qwen3.5:35b"
    description TEXT,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,          -- default orchestrator
    last_seen TIMESTAMPTZ,
    capabilities TEXT[] DEFAULT '{}',
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL DEFAULT 'general',
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default room
INSERT INTO rooms (name, description) VALUES ('general', 'Main chat room') ON CONFLICT DO NOTHING;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type VARCHAR(16) NOT NULL,          -- 'user' | 'agent'
    sender_name VARCHAR(128) NOT NULL,
    sender_id TEXT,                            -- user UUID or agent name
    mentions TEXT[] DEFAULT '{}',              -- parsed @mentions
    is_broadcast BOOLEAN DEFAULT FALSE,        -- @all
    parent_message_id UUID REFERENCES messages(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_name);

-- Agent memory (shared KV store between agents)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(64) NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_name, key)
);
