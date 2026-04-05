CREATE TABLE public.geo_rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'Сервисы',
  llm_score integer NOT NULL DEFAULT 0,
  seo_score integer NOT NULL DEFAULT 0,
  schema_score integer NOT NULL DEFAULT 0,
  direct_score integer NOT NULL DEFAULT 0,
  has_llms_txt boolean NOT NULL DEFAULT false,
  has_faqpage boolean NOT NULL DEFAULT false,
  has_schema boolean NOT NULL DEFAULT false,
  errors_count integer NOT NULL DEFAULT 0,
  top_errors jsonb DEFAULT '[]',
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.geo_rating ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read geo_rating" ON public.geo_rating FOR SELECT TO public USING (true);