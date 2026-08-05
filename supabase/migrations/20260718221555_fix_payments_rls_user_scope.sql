/*
# Fix payments RLS policies to scope by user_id

1. Security Changes
   - Drop existing admin RLS policies on payments that use USING(true)
   - Replace with user-scoped policies: auth.uid() = user_id
   - Ensures each user can only access their own payment records at the database level
   - Preserves driver-role policies unchanged

2. Important Notes
   - Previously, admin_select/update/delete policies allowed access to ALL payments
   - This caused financial reports to include other users' driver payments
   - Now each authenticated user sees only payments they created
*/

DROP POLICY IF EXISTS "admin_select_payments" ON payments;
CREATE POLICY "admin_select_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_insert_payments" ON payments;
CREATE POLICY "admin_insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_payments" ON payments;
CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_delete_payments" ON payments;
CREATE POLICY "admin_delete_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
