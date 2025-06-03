-- supabase/migrations/04_calendar_schema.sql

CREATE TYPE event_type AS ENUM ('appointment', 'viewing', 'task');

CREATE TABLE calendar (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The broker this event is associated with
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Optional: link event to a client
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- Optional: link event to a property
  event_type event_type NOT NULL,
  title TEXT NOT NULL, -- A short title for the event
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reminder BOOLEAN DEFAULT FALSE, -- Simple boolean, actual reminder logic is app-level
  -- Potential future fields: recurring_rule, location, participants (JSONB)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_broker_id ON calendar(broker_id);
CREATE INDEX idx_calendar_client_id ON calendar(client_id);
CREATE INDEX idx_calendar_property_id ON calendar(property_id);
CREATE INDEX idx_calendar_start_time ON calendar(start_time);

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
CREATE TRIGGER set_calendar_updated_at_timestamp
BEFORE UPDATE ON calendar
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS policies for calendar
ALTER TABLE calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can manage their own calendar events." ON calendar
  FOR ALL TO authenticated USING (auth.uid() = broker_id)
  WITH CHECK (auth.uid() = broker_id);
  -- This single policy covers SELECT, INSERT, UPDATE, DELETE for the owner.
