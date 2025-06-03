-- supabase/migrations/03_clients_schema.sql

CREATE TABLE clients (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The broker this client is associated with
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT, -- General notes about the client
  -- Potential future fields: last_contacted_at TIMESTAMPTZ, status (e.g., lead, active, past)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by broker_id
CREATE INDEX idx_clients_broker_id ON clients(broker_id);

-- Function to update_updated_at_column (if not already created from properties table migration)
-- Ensure this function exists or is created. If it was globally created, this isn't strictly needed here.
-- For safety, we can define it as CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' timestamp on row update
CREATE TRIGGER set_clients_updated_at_timestamp
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS policies for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view their own clients." ON clients
  FOR SELECT TO authenticated USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can insert their own clients." ON clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own clients." ON clients
  FOR UPDATE TO authenticated USING (auth.uid() = broker_id) WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can delete their own clients." ON clients
  FOR DELETE TO authenticated USING (auth.uid() = broker_id);
