/*
  # Create user_provider_consent table

  1. New Tables
    - `user_provider_consent`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `provider_id` (uuid)
      - `lab_results` (boolean, default false)
      - `medications` (boolean, default false)
      - `fitness_data` (boolean, default false)
      - `approved` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `user_provider_consent` table
    - Add policies for authenticated users to manage their own consent data
*/

-- Create user_provider_consent table
CREATE TABLE IF NOT EXISTS user_provider_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  lab_results boolean DEFAULT false,
  medications boolean DEFAULT false,
  fitness_data boolean DEFAULT false,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_provider_consent ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own consent data"
  ON user_provider_consent
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent data"
  ON user_provider_consent
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent data"
  ON user_provider_consent
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consent data"
  ON user_provider_consent
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update timestamp on record update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_user_provider_consent_updated_at
BEFORE UPDATE ON user_provider_consent
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_user_provider_consent_user_id ON user_provider_consent(user_id);
CREATE INDEX idx_user_provider_consent_provider_id ON user_provider_consent(provider_id);
CREATE UNIQUE INDEX idx_user_provider_consent_user_provider ON user_provider_consent(user_id, provider_id);