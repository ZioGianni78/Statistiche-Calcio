import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key are required.');
  // The Supabase client constructor will throw an error if these are missing,
  // which is the error the user was seeing.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);