import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase connection
// ---------------------------------------------------------------------------
// The anon key is safe to embed in client-side code – it only grants access
// that Row Level Security (RLS) policies explicitly allow.
//
// To override at build time, set these environment variables:
//   VITE_SUPABASE_URL=https://jelhetcesvqjyfhnuxyb.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// In production hosting (Vercel, Netlify, etc.), add them as env vars in the
// dashboard so they are baked in at build time.
// ---------------------------------------------------------------------------

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://jelhetcesvqjyfhnuxyb.supabase.co';

const supabaseKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbGhldGNlc3ZxanlmaG51eHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTEzMTUsImV4cCI6MjA4OTY1MTMxNX0.placeholder-replace-with-your-actual-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl, supabaseKey };
