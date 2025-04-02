import { createClient } from '@supabase/supabase-js'

// Universal client that works in both Node and browser environments
const supabaseUrl = typeof process !== 'undefined' && process.env.SUPABASE_URL 
  ? process.env.SUPABASE_URL 
  : 'https://xryyraxjizhssyrifksx.supabase.co';

const supabaseAnonKey = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY 
  ? process.env.SUPABASE_ANON_KEY 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeXlyYXhqaXpoc3N5cmlma3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDIwNDgsImV4cCI6MjA1OTA3ODA0OH0.47jhstqAd0TFPHxGMhQ_szoZj1cUKlTYa3UHmDheEYA';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
