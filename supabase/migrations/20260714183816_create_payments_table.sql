/*
# Create payments table with driver earnings support

1. New Tables
  - `payments`
    - `id` (uuid, primary key)
    - `driver_id` (uuid, references drivers.id)
    - `user_id` (uuid, nullable - admin auth user id, null for driver-added)
    - `amount` (numeric, not null)
    - `date` (date, not null)
    - `status` (text, 'pending' or 'paid')
    - `description` (text)
    - `source` (text, 'admin' or 'driver' - who created this payment)
    - `completed_at` (timestamptz, nullable)
    - `created_at` (timestamptz, default now())

2. Security
  - Enable RLS on payments
  - Authenticated users (admins) can fully manage payments
  - Anon users can read/insert via RPC functions only

3. RPC Functions
  - `get_driver_payments` - lets drivers read their own payments
  - `add_driver_payment` - lets drivers add manual earnings

4. Notes
  - source='admin' means the admin/dispatcher created the payment
  - source='driver' means the driver manually added it
  - Both sources are visible to both admin and driver
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES drivers(id),
  user_id uuid,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  description text,
  source text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'driver')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add source column if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'source'
  ) THEN
    ALTER TABLE payments ADD COLUMN source text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'driver'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (admins)
DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_payments" ON payments;
CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_payments" ON payments;
CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_payments" ON payments;
CREATE POLICY "delete_payments" ON payments FOR DELETE
  TO authenticated USING (true);

-- RPC function for drivers to read their payments
CREATE OR REPLACE FUNCTION get_driver_payments(driver_uuid uuid)
RETURNS SETOF payments
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM payments
  WHERE driver_id = driver_uuid
  ORDER BY date DESC;
$$;

-- RPC function for drivers to add manual earnings
CREATE OR REPLACE FUNCTION add_driver_payment(
  p_driver_id uuid,
  p_amount numeric,
  p_date date,
  p_description text
)
RETURNS payments
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO payments (driver_id, amount, date, status, description, source)
  VALUES (p_driver_id, p_amount, p_date, 'paid', p_description, 'driver')
  RETURNING *;
$$;

-- Re-create mark_payment_paid RPC if it doesn't exist
CREATE OR REPLACE FUNCTION mark_payment_paid(payment_id uuid)
RETURNS SETOF payments
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE payments
  SET status = 'paid', completed_at = now()
  WHERE id = payment_id
  RETURNING *;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_driver_payments(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_driver_payment(uuid, numeric, date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_payment_paid(uuid) TO authenticated;
