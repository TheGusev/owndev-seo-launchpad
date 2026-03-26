
-- Scan rules (checklist stored in DB, not code)
CREATE TABLE public.scan_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL CHECK (module IN ('technical','content','direct','competitors','semantics','schema','ai')),
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  title text NOT NULL,
  description text,
  how_to_check text,
  fix_template text,
  score_weight integer NOT NULL DEFAULT 5,
  visible_in_preview boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scans table
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  mode text NOT NULL DEFAULT 'page' CHECK (mode IN ('page','site')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  progress_pct integer NOT NULL DEFAULT 0,
  scores jsonb DEFAULT '{}',
  issues jsonb DEFAULT '[]',
  theme text,
  competitors jsonb DEFAULT '[]',
  keywords jsonb DEFAULT '[]',
  minus_words jsonb DEFAULT '[]',
  raw_html text,
  crawled_pages jsonb DEFAULT '[]',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours')
);

-- Reports table (payment/download)
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  email text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  payment_id text,
  download_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  pdf_path text,
  docx_path text,
  keywords_csv_path text,
  minus_words_csv_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: scans and reports are public read (by id), no auth required
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_rules ENABLE ROW LEVEL SECURITY;

-- Anyone can read scans by id
CREATE POLICY "Public read scans" ON public.scans FOR SELECT USING (true);

-- Anyone can read reports if they have the correct download_token (checked in edge function)
CREATE POLICY "Public read reports" ON public.reports FOR SELECT USING (true);

-- Scan rules are public read
CREATE POLICY "Public read scan_rules" ON public.scan_rules FOR SELECT USING (true);

-- Service role can insert/update (edge functions use service role)
CREATE POLICY "Service insert scans" ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update scans" ON public.scans FOR UPDATE USING (true);
CREATE POLICY "Service insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update reports" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Service insert scan_rules" ON public.scan_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update scan_rules" ON public.scan_rules FOR UPDATE USING (true);

-- Create storage bucket for report files
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Storage policy: allow public read with signed URLs (handled by service role)
CREATE POLICY "Service upload reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reports');
CREATE POLICY "Service read reports" ON storage.objects FOR SELECT USING (bucket_id = 'reports');
