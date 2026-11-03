import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Supabase is retiring the legacy anon key in early 2027. Prefer the new
// publishable key and fall back to the anon key while the project migrates.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => clerkToken, // Det här är det rekommenderade sättet
  });
};