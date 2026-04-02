
CREATE TABLE public.tech_stack_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  scanned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tech_stack_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tech_stack_cache" ON public.tech_stack_cache FOR SELECT TO public USING (true);
CREATE POLICY "Service role manage tech_stack_cache" ON public.tech_stack_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
