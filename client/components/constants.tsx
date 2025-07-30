export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!

if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY || !BACKEND_API_URL) {
  throw new Error("Missing environment variables for Supabase or backend API URL")
}