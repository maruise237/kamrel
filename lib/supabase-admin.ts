import { createClient } from '@supabase/supabase-js'

// Admin client for server-side operations with elevated permissions
// This should only be used on the server side, never in client-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseServiceKey) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY - using anon key for admin operations')
}

export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to check if we're running on the server
export const isServer = typeof window === 'undefined'

// Secure wrapper for admin operations
export async function withAdminAuth<T>(
  operation: () => Promise<T>,
  context: string = 'admin operation'
): Promise<T> {
  if (!isServer) {
    throw new Error(`${context} can only be performed on the server side`)
  }
  
  try {
    console.log(`Executing ${context} with admin privileges`)
    return await operation()
  } catch (error) {
    console.error(`Error in ${context}:`, error)
    throw error
  }
}