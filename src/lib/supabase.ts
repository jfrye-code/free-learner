import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase connection config
// ---------------------------------------------------------------------------
// Option A (recommended): set these in a .env or .env.local file at the
//   project root so they are never committed to source control:
//
//   VITE_SUPABASE_URL=https://jelhetcesvqjyfhnuxyb.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-real-key...
//
// Option B: replace the fallback strings below directly (less secure).
// ---------------------------------------------------------------------------

const PLACEHOLDER_SIGNATURE = 'placeholder-replace-with-your-actual-anon-key';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://jelhetcesvqjyfhnuxyb.supabase.co';

const supabaseKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbGhldGNlc3ZxanlmaG51eHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTEzMTUsImV4cCI6MjA4OTY1MTMxNX0.${PLACEHOLDER_SIGNATURE}`;

// Runtime check – lets calling code show a helpful message instead of a
// cryptic "Failed to fetch" error.
export const isSupabaseConfigured = !supabaseKey.endsWith(PLACEHOLDER_SIGNATURE);

if (!isSupabaseConfigured) {
  console.warn(
    '\n⚠️  Supabase anon key is still a placeholder!\n' +
    '   Login, signup, and all database features will fail.\n\n' +
    '   To fix:\n' +
    '   1. Go to your Supabase dashboard → Settings → API\n' +
    '   2. Copy the "anon public" key\n' +
    '   3. Create a .env.local file in the project root with:\n\n' +
    '      VITE_SUPABASE_URL=https://jelhetcesvqjyfhnuxyb.supabase.co\n' +
    '      VITE_SUPABASE_ANON_KEY=<paste-your-real-key-here>\n\n' +
    '   4. Restart the dev server (npm run dev)\n'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl, supabaseKey };
