-- Drop the existing strictly authenticated policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.analytics_events;

-- Create the new policy allowing both authenticated and anonymous inserts
-- We use FOR INSERT to strictly limit permissions to INSERT only.
CREATE POLICY "Enable insert for authenticated and anon users" ON public.analytics_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );
