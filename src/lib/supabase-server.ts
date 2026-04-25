import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mmjwerxhexzcahthzmyq.supabase.co";
const supabaseServiceKey =
process.env.SUPABASE_SERVICE_ROLE_KEY! ;

/**
 * Server-side Supabase client for API routes.
 * Uses hardcoded credentials for reliable connection.
 */
export function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/** Normalize phone to digits only for consistent matching. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}
