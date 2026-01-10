import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminSecret = import.meta.env.VITE_SUPABASE_ADMIN_SECRET; // Hämta från .env

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Publik klient (används för att läsa artiklar/foton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Säker Admin-klient
export const createClerkSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-myelie-admin': adminSecret,
      },
    },
  });
};