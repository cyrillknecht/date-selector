import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase/session'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSessionClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/creator/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?reason=session_expired`)
}
