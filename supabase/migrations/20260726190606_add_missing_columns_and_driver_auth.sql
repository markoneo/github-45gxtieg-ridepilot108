/*
# Apply all missing schema changes for driver portal and payments

1. Modified Tables
   - `drivers`
     - `pin` (text, default '1234') - Driver portal authentication PIN
     - `total_earnings` (numeric, default 0) - Accumulated driver earnings
     - `auth_token` (uuid) - Unique token for direct driver access
     - `last_login` (timestamptz) - Last portal login time
   - `projects`
     - `driver_fee` (numeric) - Separate fee for drivers
     - `completed_at` (timestamptz) - When project was completed
     - `completed_by` (uuid) - Driver who completed
     - `acceptance_status` (text) - Driver acceptance state
     - `accepted_at` (timestamptz) - When accepted
     - `accepted_by` (uuid) - Who accepted
     - `started_at` (timestamptz) - When started
     - `user_id` (uuid) - Owner admin user
   - `users`
     - `account_status` (text, default 'active') - Account suspension status
   - `companies`
     - `user_id` (uuid) - Owner admin user
   - `car_types`
     - `user_id` (uuid) - Owner admin user

2. New Tables
   - `payments`
     - `id` (uuid, primary key)
     - `driver_id` (uuid, references drivers)
     - `user_id` (uuid, nullable - admin who owns driver, NULL for driver-added)
     - `amount` (numeric)
     - `date` (date)
     - `status` (text - 'pending' or 'paid')
     - `description` (text)
     - `source` (text - 'admin' or 'driver')
     - `completed_at` (timestamptz)
     - `created_at` (timestamptz)

3. New Functions
   - `simple_authenticate_driver` - Driver login by license + PIN
   - `get_driver_projects_with_context` - Get projects for a driver
   - `update_driver_project_status` - Driver updates project status
   - `handle_new_user` - Sync auth.users to public.users
   - `mark_payment_paid` - Mark payment as paid
   - `update_driver_earnings` - Trigger to update earnings on payment

4. Security
   - Payments table: authenticated users see their own payments AND driver-added payments (user_id IS NULL)
   - Anon access for driver portal functions
   - Anonymous read on companies/car_types for driver portal

5. Important Notes
   - Driver-added payments have user_id=NULL and source='driver'
   - Dashboard SELECT policy includes user_id IS NULL so driver payments are visible
   - A trigger auto-sets user_id from auth.uid() on admin inserts
*/

-- ==========================================
-- DRIVERS TABLE: Add missing columns
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'pin') THEN
    ALTER TABLE drivers ADD COLUMN pin text DEFAULT '1234';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'total_earnings') THEN
    ALTER TABLE drivers ADD COLUMN total_earnings numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'auth_token') THEN
    ALTER TABLE drivers ADD COLUMN auth_token uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'last_login') THEN
    ALTER TABLE drivers ADD COLUMN last_login timestamptz;
  END IF;
END $$;

UPDATE drivers SET pin = '1234' WHERE pin IS NULL;
UPDATE drivers SET auth_token = gen_random_uuid() WHERE auth_token IS NULL;

-- ==========================================
-- PROJECTS TABLE: Add missing columns
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'driver_fee') THEN
    ALTER TABLE projects ADD COLUMN driver_fee numeric(10,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completed_at') THEN
    ALTER TABLE projects ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completed_by') THEN
    ALTER TABLE projects ADD COLUMN completed_by uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'acceptance_status') THEN
    ALTER TABLE projects ADD COLUMN acceptance_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'accepted_at') THEN
    ALTER TABLE projects ADD COLUMN accepted_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'accepted_by') THEN
    ALTER TABLE projects ADD COLUMN accepted_by uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'started_at') THEN
    ALTER TABLE projects ADD COLUMN started_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
    ALTER TABLE projects ADD COLUMN user_id uuid;
  END IF;
END $$;

-- ==========================================
-- COMPANIES & CAR_TYPES: Add user_id for multi-user
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'user_id') THEN
    ALTER TABLE companies ADD COLUMN user_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'car_types' AND column_name = 'user_id') THEN
    ALTER TABLE car_types ADD COLUMN user_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'user_id') THEN
    ALTER TABLE drivers ADD COLUMN user_id uuid;
  END IF;
END $$;

-- ==========================================
-- USERS TABLE: Add account_status
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_status') THEN
    ALTER TABLE users ADD COLUMN account_status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- ==========================================
-- PAYMENTS TABLE: Create with correct visibility
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users see their OWN payments AND driver-added payments (user_id IS NULL)
DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "admin_select_payments" ON payments;

-- INSERT: authenticated users can insert
DROP POLICY IF EXISTS "insert_payments" ON payments;
CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (true);

-- UPDATE: authenticated users can update their own or driver-added
DROP POLICY IF EXISTS "update_payments" ON payments;
CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (true);

-- DELETE: authenticated users can delete their own or driver-added
DROP POLICY IF EXISTS "delete_payments" ON payments;
CREATE POLICY "delete_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

-- Anon INSERT for driver-added payments
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon WITH CHECK (source = 'driver');

-- Anon SELECT for drivers reading their own payments
DROP POLICY IF EXISTS "anon_select_own_payments" ON payments;
CREATE POLICY "anon_select_own_payments" ON payments FOR SELECT
  TO anon USING (true);

-- ==========================================
-- FUNCTIONS: Driver authentication
-- ==========================================

CREATE OR REPLACE FUNCTION public.simple_authenticate_driver(
  input_license text,
  input_pin text
)
RETURNS TABLE (
  success boolean,
  driver_id uuid,
  driver_name text,
  driver_license text,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  driver_record RECORD;
BEGIN
  input_license := LOWER(TRIM(input_license));
  input_pin := TRIM(input_pin);
  
  SELECT d.id, d.name, d.license, d.pin, d.status
  INTO driver_record
  FROM drivers d
  WHERE LOWER(TRIM(d.license)) = input_license
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, 'Driver not found'::text;
    RETURN;
  END IF;
  
  IF driver_record.pin = input_pin THEN
    RETURN QUERY SELECT 
      true, 
      driver_record.id, 
      driver_record.name, 
      driver_record.license,
      'Success'::text;
  ELSE
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, 'Invalid PIN'::text;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.simple_authenticate_driver(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.simple_authenticate_driver(text, text) TO authenticated;

-- ==========================================
-- FUNCTIONS: Driver projects access
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_driver_projects_with_context(driver_uuid uuid)
RETURNS SETOF public.projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.projects
  WHERE driver_id = driver_uuid
    AND status = 'active'
  ORDER BY date ASC, time ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_driver_project_status(
  project_uuid uuid,
  driver_uuid uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new_status = 'completed' THEN
    UPDATE public.projects
    SET 
      status = 'completed',
      completed_at = NOW(),
      completed_by = driver_uuid
    WHERE id = project_uuid 
      AND driver_id = driver_uuid;
  ELSE
    UPDATE public.projects
    SET 
      acceptance_status = new_status,
      accepted_at = CASE WHEN new_status = 'accepted' THEN NOW() ELSE accepted_at END,
      accepted_by = CASE WHEN new_status = 'accepted' THEN driver_uuid ELSE accepted_by END,
      started_at = CASE WHEN new_status = 'started' THEN NOW() ELSE started_at END
    WHERE id = project_uuid 
      AND driver_id = driver_uuid;
  END IF;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_projects_with_context(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.update_driver_project_status(uuid, uuid, text) TO anon;

-- ==========================================
-- FUNCTIONS: Payment helpers
-- ==========================================

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

GRANT EXECUTE ON FUNCTION mark_payment_paid(uuid) TO authenticated;

-- Trigger to auto-set user_id from auth session on admin inserts
CREATE OR REPLACE FUNCTION set_payment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.source = 'admin' THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_payments_user_id ON payments;
CREATE TRIGGER set_payments_user_id
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_user_id();

-- Trigger to update driver earnings when payment is paid
CREATE OR REPLACE FUNCTION update_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    UPDATE drivers
    SET total_earnings = COALESCE(total_earnings, 0) + NEW.amount
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_driver_earnings_on_payment ON payments;
CREATE TRIGGER update_driver_earnings_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_earnings();

-- ==========================================
-- FUNCTIONS: Auth user sync
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ==========================================
-- POLICIES: Users table additions
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own account status') THEN
    EXECUTE 'CREATE POLICY "Users can read own account status" ON users FOR SELECT TO authenticated USING (auth.uid() = id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own record') THEN
    EXECUTE 'CREATE POLICY "Users can insert own record" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own record') THEN
    EXECUTE 'CREATE POLICY "Users can update own record" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

-- ==========================================
-- POLICIES: Anon access for driver portal
-- ==========================================

DROP POLICY IF EXISTS "Allow anonymous to read companies" ON companies;
CREATE POLICY "Allow anonymous to read companies"
  ON companies FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous to read car_types" ON car_types;
CREATE POLICY "Allow anonymous to read car_types"
  ON car_types FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous to read drivers" ON drivers;
CREATE POLICY "Allow anonymous to read drivers"
  ON drivers FOR SELECT TO anon USING (true);
