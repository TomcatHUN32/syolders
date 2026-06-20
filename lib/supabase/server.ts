import { createClient } from '@supabase/supabase-js';
import { Database } from './client';

export function createSupabaseServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
