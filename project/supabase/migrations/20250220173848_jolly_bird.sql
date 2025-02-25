/*
  # Initial schema setup for PDF processing system

  1. New Tables
    - `pdf_questionnaires`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text) - Name of the questionnaire
      - `questions` (jsonb) - Stored questions and answers
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `pdf_questionnaires` table
    - Add policies for authenticated users to:
      - Read their own questionnaires
      - Create new questionnaires
*/

CREATE TABLE IF NOT EXISTS pdf_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_questionnaires ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own questionnaires
CREATE POLICY "Users can read own questionnaires"
  ON pdf_questionnaires
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own questionnaires
CREATE POLICY "Users can create questionnaires"
  ON pdf_questionnaires
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);