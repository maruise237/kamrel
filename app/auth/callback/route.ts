import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const inviteToken = requestUrl.searchParams.get('invite')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      const { data } = await supabase.auth.exchangeCodeForSession(code)
      
      // Create default workspace for new user if they don't have one
      if (data.user) {
        try {
          await supabase.functions.invoke('create-default-workspace', {
            body: { invite_token: inviteToken }
          })
        } catch (error) {
          console.error('Error creating workspace:', error)
        }
      }
      
      // If there's an invite token, redirect to accept invite
      if (inviteToken) {
        return NextResponse.redirect(new URL(`/auth/accept-invite?token=${inviteToken}`, requestUrl.origin))
      }
      
      // Otherwise redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}