import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development fallbacks (anon key is a publishable key designed for client-side use)
const DEV_URL = "https://jpiiflsbbjllmvnnosrb.supabase.co";
const DEV_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaWlmbHNiYmpsbG12bm5vc3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjIzODQsImV4cCI6MjA5NjQ5ODM4NH0.sK7cBxQm3pVsgEHf3g_bkbUU3ZUYatTybM2C9e7y-_Y";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. " +
    "Falling back to dev defaults. Create a .env file to configure your own project."
  );
}

export const supabase = createClient(
  supabaseUrl || DEV_URL,
  supabaseAnonKey || DEV_ANON_KEY
);
