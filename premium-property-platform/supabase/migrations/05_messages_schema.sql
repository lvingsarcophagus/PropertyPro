-- supabase/migrations/05_messages_schema.sql

CREATE TABLE messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Can also be a client_id if messaging clients not in auth.users
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- Optional: link message to a property
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE, -- For tracking read status by the receiver
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  -- No updated_at for messages usually, as they are immutable once sent.

  CONSTRAINT check_sender_not_receiver CHECK (sender_id <> receiver_id)
);

-- Indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
-- Composite index for fetching conversations
CREATE INDEX idx_messages_participants ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), sent_at DESC);


-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received.
CREATE POLICY "Users can view their own messages." ON messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert messages as themselves (sender_id must be the current user).
CREATE POLICY "Users can insert their own messages." ON messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Generally, messages are immutable. Updates might only be for 'is_read' status.
-- Policy for updating 'is_read' status by the receiver.
-- A simpler UPDATE policy if only 'is_read' is mutable by receiver:
CREATE POLICY "Receivers can update is_read status." ON messages
   FOR UPDATE TO authenticated USING (auth.uid() = receiver_id)
   WITH CHECK (auth.uid() = receiver_id AND sender_id <> auth.uid()); -- Ensure only receiver can update, and only specific fields (implicitly via app logic for now)
   -- A more restrictive check for only allowing 'is_read' to change:
   -- WITH CHECK (auth.uid() = receiver_id AND (SELECT count(*) = 1 AND bool_and(key = 'is_read') FROM jsonb_each(to_jsonb(EXCLUDED) - to_jsonb(OLD))));
   -- The above is complex. For now, app logic should ensure only 'is_read' is updated by receiver.


-- Deleting messages can be complex (soft delete vs hard delete, who can delete).
-- For this phase, we will NOT allow any DELETE via RLS directly. Deletion can be an admin task or a future feature.
