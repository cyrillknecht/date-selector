import { createSessionClient } from '@/lib/supabase/session'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createSessionClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
}
