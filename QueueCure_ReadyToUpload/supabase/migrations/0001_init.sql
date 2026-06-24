-- 1. Create patients table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number INT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'done')),
  created_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. Create clinic_settings table
CREATE TABLE clinic_settings (
  id INT PRIMARY KEY DEFAULT 1,
  avg_consultation_minutes INT NOT NULL DEFAULT 15,
  current_token INT DEFAULT 0
);

-- Insert one default row into clinic_settings
INSERT INTO clinic_settings (id, avg_consultation_minutes, current_token) VALUES (1, 15, 0);

-- 3. Enable Realtime on the tables
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE clinic_settings;
