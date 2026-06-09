import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jpiiflsbbjllmvnnosrb.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaWlmbHNiYmpsbG12bm5vc3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjIzODQsImV4cCI6MjA5NjQ5ODM4NH0.sK7cBxQm3pVsgEHf3g_bkbUU3ZUYatTybM2C9e7y-_Y";
const supabaseServiceKey =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaWlmbHNiYmpsbG12bm5vc3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkyMjM4NCwiZXhwIjoyMDk2NDk4Mzg0fQ.Z0wbGRH-3iHj6dc2kml8bZ2SrxS5jstmegU3Uk-Nnig";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
