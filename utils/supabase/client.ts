import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern - عشان منعملش instance جديد كل مرة
// وده اللي كان بيسبب الـ infinite loop مع onAuthStateChange
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}