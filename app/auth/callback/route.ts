import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/send'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Déterminer l'URL externe (Railway passe x-forwarded-host)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

  console.log('[Auth Callback] baseUrl:', baseUrl, '| code:', !!code, '| next:', next)

  if (code) {
    const response = NextResponse.redirect(`${baseUrl}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Ensure profile exists (fallback if DB trigger didn't fire)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { error: profileErr } = await adminClient
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email ?? '',
              full_name: user.user_metadata?.full_name ?? '',
              avatar_url: user.user_metadata?.avatar_url ?? null,
            })

          if (profileErr) {
            console.error('[Auth Callback] Failed to create profile:', profileErr.message)
          } else {
            console.log('[Auth Callback] Profile created for user:', user.id)
          }
        }

        // Envoyer un email de bienvenue si nouvel utilisateur (créé il y a moins de 60s)
        const createdAt = new Date(user.created_at).getTime()
        const isNewUser = Date.now() - createdAt < 60_000
        if (isNewUser) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
          sendWelcomeEmail(user.email!, name).catch(console.error)
        }
      }

      console.log('[Auth Callback] Session created, redirecting to:', `${baseUrl}${next}`)
      return response
    }
  }

  console.log('[Auth Callback] No code or error, redirecting to login')
  return NextResponse.redirect(`${baseUrl}/login`)
}
