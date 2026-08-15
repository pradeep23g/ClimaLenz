-- SQL Schema with RLS for ClimaLenz Supabase Project: rynckiteewsuitataljt
-- Run this script in the Supabase SQL Editor to set up required tables and security policies.

-- 1. Agent Traces Table
CREATE TABLE IF NOT EXISTS agent_traces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NULL,
    agent_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    trace_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for session history lookups
CREATE INDEX IF NOT EXISTS idx_agent_traces_session_id ON agent_traces(session_id);

-- 2. Agent Chat Memory Table
CREATE TABLE IF NOT EXISTS agent_chat_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NULL,
    user_prompt TEXT NOT NULL,
    assistant_response JSONB NOT NULL,
    tool_calls JSONB NULL,
    model_name TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for chat memory lookups
CREATE INDEX IF NOT EXISTS idx_agent_chat_memory_session_id ON agent_chat_memory(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE agent_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chat_memory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow read access on agent_traces" ON agent_traces;
DROP POLICY IF EXISTS "Allow insert access on agent_traces" ON agent_traces;
DROP POLICY IF EXISTS "Allow read access on agent_chat_memory" ON agent_chat_memory;
DROP POLICY IF EXISTS "Allow insert access on agent_chat_memory" ON agent_chat_memory;

-- Create Policies for SELECT & INSERT
-- (Ensures operations work cleanly whether using Secret (service_role) or Publishable (anon) keys)

CREATE POLICY "Allow read access on agent_traces" ON agent_traces
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access on agent_traces" ON agent_traces
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access on agent_chat_memory" ON agent_chat_memory
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access on agent_chat_memory" ON agent_chat_memory
    FOR INSERT WITH CHECK (true);
