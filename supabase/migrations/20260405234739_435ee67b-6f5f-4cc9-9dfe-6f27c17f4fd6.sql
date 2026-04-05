
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-covers', 'blog-covers', true);

CREATE POLICY "Public read blog covers" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'blog-covers');

CREATE POLICY "Service upload blog covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-covers');
