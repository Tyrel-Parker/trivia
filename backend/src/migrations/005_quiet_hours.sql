ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS quiet_start_hour INTEGER CHECK (quiet_start_hour >= 0 AND quiet_start_hour <= 23),
  ADD COLUMN IF NOT EXISTS quiet_end_hour   INTEGER CHECK (quiet_end_hour   >= 0 AND quiet_end_hour   <= 23);
