import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
// Get these values from: Supabase Dashboard → Settings → API
const supabaseUrl = 'https://jelhetcesvqjyfhnuxyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbGhldGNlc3ZxanlmaG51eHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTEzMTUsImV4cCI6MjA4OTY1MTMxNX0.placeholder-replace-with-your-actual-anon-key';
// ⚠️  IMPORTANT: Replace the supabaseKey above with your REAL anon key from:
//     Supabase Dashboard → Settings → API → Project API keys → anon public
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl, supabaseKey };
