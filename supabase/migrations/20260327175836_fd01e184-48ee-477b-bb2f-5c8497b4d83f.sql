
-- Add missing columns to scan_rules
ALTER TABLE public.scan_rules 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'technical',
  ADD COLUMN IF NOT EXISTS example_fix text,
  ADD COLUMN IF NOT EXISTS rule_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS trigger_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scan_rules_module_active ON public.scan_rules (module, active);
CREATE INDEX IF NOT EXISTS idx_scan_rules_source ON public.scan_rules (source);

-- Allow service role to update trigger_count (RLS policy for update)
CREATE POLICY "Service role can update scan_rules" ON public.scan_rules
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Allow service role to insert scan_rules  
CREATE POLICY "Service role can insert scan_rules" ON public.scan_rules
  FOR INSERT TO service_role WITH CHECK (true);

-- Allow service role to delete scan_rules
CREATE POLICY "Service role can delete scan_rules" ON public.scan_rules
  FOR DELETE TO service_role USING (true);
