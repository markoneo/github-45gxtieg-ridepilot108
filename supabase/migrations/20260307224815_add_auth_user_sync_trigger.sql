/*
  # Add trigger to sync auth.users with public.users

  1. New Functions
    - `handle_new_user()` - Automatically creates a row in `public.users`
      when a new user signs up via Supabase Auth

  2. New Triggers
    - `on_auth_user_created` - Fires after INSERT on `auth.users`,
      calls `handle_new_user()`

  3. Security
    - Add INSERT policy on `public.users` so the trigger (service role) can insert
    - Add UPDATE policy on `public.users` so users can update own record

  4. Notes
    - This ensures every Supabase Auth signup automatically gets a
      corresponding public.users row with matching id and email
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can insert own record'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own record" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can update own record'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own record" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;
