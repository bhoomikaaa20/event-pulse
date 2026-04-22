
DROP POLICY "Anyone can log a view" ON public.event_views;
CREATE POLICY "Authenticated can log a view"
  ON public.event_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update increment_view to require auth
CREATE OR REPLACE FUNCTION public.increment_view(_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.event_views (event_id, user_id) VALUES (_event_id, auth.uid());
  END IF;
  UPDATE public.events SET views_count = views_count + 1, updated_at = now() WHERE id = _event_id;
END;
$$;
