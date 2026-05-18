import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Advertencia: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configurados en el archivo .env.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
