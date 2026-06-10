-- PDFCraft Enterprise - Supabase Migration
-- Creates the pdf_operations table with Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS pdf_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  filename TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  operation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE pdf_operations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own records
CREATE POLICY "Users can view own operations"
  ON pdf_operations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own records
CREATE POLICY "Users can insert own operations"
  ON pdf_operations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own records
CREATE POLICY "Users can delete own operations"
  ON pdf_operations FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster user lookups
CREATE INDEX idx_pdf_operations_user_id ON pdf_operations(user_id);
CREATE INDEX idx_pdf_operations_created_at ON pdf_operations(created_at DESC);

-- Storage bucket for PDF outputs (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-outputs', 'pdf-outputs', false);

-- Storage RLS: Users can only access their own folder
-- CREATE POLICY "Users can upload to own folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'pdf-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'pdf-outputs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── OmniDoc OS: Conversion History ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversion_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  source_format TEXT NOT NULL,
  target_format TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversion_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversions"
  ON conversion_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own conversions"
  ON conversion_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_conversion_history_user ON conversion_history(user_id);
CREATE INDEX idx_conversion_history_created ON conversion_history(created_at DESC);
