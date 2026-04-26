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

export async function createCard(moduleId: string, flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  const { data } = await supabase
    .from('cards')
    .select('position')
    .eq('decision_module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1)
  const position = ((data?.[0]?.position ?? -1) as number) + 1
  await supabase.from('cards').insert({
    decision_module_id: moduleId,
    position,
    title: 'New Card',
    mood_tags: [],
    photo_urls: [],
  })
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
}

export async function updateCard(cardId: string, moduleId: string, flowId: string, formData: FormData) {
  await requireAuth()
  const supabase = createServerClient()
  const photoUrlsRaw = (formData.get('photo_urls') as string) || ''
  const photo_urls = photoUrlsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
  const moodTagsRaw = (formData.get('mood_tags') as string) || ''
  const mood_tags = moodTagsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  await supabase
    .from('cards')
    .update({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      price_range: (formData.get('price_range') as string) || null,
      url: (formData.get('url') as string) || null,
      photo_urls,
      mood_tags,
    })
    .eq('id', cardId)
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
}

export async function deleteCard(cardId: string, moduleId: string, flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase.from('cards').delete().eq('id', cardId)
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
}
