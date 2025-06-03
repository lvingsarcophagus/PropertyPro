-- supabase/migrations/06_calls_schema.sql

CREATE TABLE calls (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The broker who logged the call
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Optional: link call to a client
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- Optional: link call to a specific property discussed
  -- title TEXT, -- Optional: A short title or subject for the call if needed
  description TEXT NOT NULL, -- Details about the call
  call_time TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When the call occurred or was logged
  duration_minutes INTEGER, -- Optional: duration of the call
  outcome TEXT, -- Optional: e.g., 'Follow-up scheduled', 'Interested', 'Not interested'
  reminder_at TIMESTAMPTZ, -- Optional: for a follow-up reminder
  reminder_sent BOOLEAN DEFAULT FALSE, -- To track if the reminder has been processed by an external system/job

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_broker_id ON calls(broker_id);
CREATE INDEX idx_calls_client_id ON calls(client_id);
CREATE INDEX idx_calls_property_id ON calls(property_id);
CREATE INDEX idx_calls_call_time ON calls(call_time DESC);
CREATE INDEX idx_calls_reminder_at ON calls(reminder_at);

-- Ensure the function trigger_set_timestamp exists (should be from previous migrations)
-- CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()... (if not already globally available)
-- Re-affirming for safety, as it's used by this table.
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger to update 'updated_at' timestamp on row update
CREATE TRIGGER set_calls_updated_at_timestamp
BEFORE UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS policies for calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can manage their own call logs." ON calls
  FOR ALL TO authenticated USING (auth.uid() = broker_id)
  WITH CHECK (auth.uid() = broker_id);
  -- This single policy covers SELECT, INSERT, UPDATE, DELETE for the owner.
