'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createSessionClient } from '@/lib/supabase/session'

async function requireAuth() {
  const session = await createSessionClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')
  return user
}

export async function createFlow() {
  const user = await requireAuth()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('flows')
    .insert({ title: 'Untitled Flow', status: 'draft', user_id: user.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  redirect(`/creator/flows/${data.id}`)
}

export async function updateFlow(id: string, formData: FormData) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase
    .from('flows')
    .update({
      title: (formData.get('title') as string) || 'Untitled Flow',
      intro_message: (formData.get('intro_message') as string) || null,
      outro_message: (formData.get('outro_message') as string) || null,
    })
    .eq('id', id)
  revalidatePath(`/creator/flows/${id}`)
}

export async function archiveFlow(id: string) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase
    .from('flows')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/creator/dashboard')
  redirect('/creator/dashboard')
}

export async function publishFlow(id: string) {
  await requireAuth()
  const supabase = createServerClient()
  const token = crypto.randomUUID()
  await supabase
    .from('flows')
    .update({ status: 'published', published_at: new Date().toISOString(), token })
    .eq('id', id)
  revalidatePath(`/creator/flows/${id}`)
}

export async function unpublishFlow(id: string) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase
    .from('flows')
    .update({ status: 'draft', published_at: null, token: null })
    .eq('id', id)
  revalidatePath(`/creator/flows/${id}`)
}

export async function confirmDate(id: string, formData: FormData) {
  await requireAuth()
  const supabase = createServerClient()
  const confirmedCardId = formData.get('confirmed_card_id') as string
  const confirmedAt = formData.get('confirmed_at') as string
  const meetingPoint = (formData.get('meeting_point') as string).trim() || null

  if (!confirmedCardId || !confirmedAt) return

  await supabase
    .from('flows')
    .update({
      confirmed_card_id: confirmedCardId,
      confirmed_at: new Date(confirmedAt).toISOString(),
      meeting_point: meetingPoint,
    })
    .eq('id', id)

  revalidatePath(`/creator/flows/${id}`)
}
