-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  reason_for_visit TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')) NOT NULL,
  queue_number SERIAL,
  estimated_wait_time INTEGER
);

-- Enable Realtime for the patients table
-- This is critical so the waiting room screen updates instantly!
alter publication supabase_realtime add table patients;
