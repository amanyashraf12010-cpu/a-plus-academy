-- Drop the policy if it already exists to prevent duplicate/conflicting policies
DROP POLICY IF EXISTS "Subscriptions update policy" ON public.subscriptions;

-- Create the new update policy for students on their own subscriptions
CREATE POLICY "Subscriptions update policy" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
