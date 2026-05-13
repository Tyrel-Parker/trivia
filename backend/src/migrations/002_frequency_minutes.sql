ALTER TABLE profiles
  RENAME COLUMN send_frequency_hours TO send_frequency_minutes;

ALTER TABLE profiles
  ALTER COLUMN send_frequency_minutes SET DEFAULT 240;

UPDATE profiles SET send_frequency_minutes = send_frequency_minutes * 60;
