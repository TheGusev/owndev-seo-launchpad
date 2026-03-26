
-- Drop overly permissive insert/update policies
DROP POLICY "Service insert scans" ON public.scans;
DROP POLICY "Service update scans" ON public.scans;
DROP POLICY "Service insert reports" ON public.reports;
DROP POLICY "Service update reports" ON public.reports;
DROP POLICY "Service insert scan_rules" ON public.scan_rules;
DROP POLICY "Service update scan_rules" ON public.scan_rules;

-- Only service_role (edge functions) can insert/update via bypassing RLS
-- No anon/authenticated insert/update policies needed since edge functions use service_role which bypasses RLS
