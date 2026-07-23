ALTER TABLE public.poll_options DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can insert poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Auth users can update poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Auth users can delete poll options" ON public.poll_options;
