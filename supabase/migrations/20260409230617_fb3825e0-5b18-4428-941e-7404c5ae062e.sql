
CREATE TABLE public.geo_rating_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'Другое',
  email text,
  scan_id text,
  total_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.geo_rating_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can nominate"
  ON public.geo_rating_nominations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read nominations"
  ON public.geo_rating_nominations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can update nominations"
  ON public.geo_rating_nominations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete nominations"
  ON public.geo_rating_nominations
  FOR DELETE
  TO service_role
  USING (true);
