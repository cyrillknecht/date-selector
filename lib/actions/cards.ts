'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createCard(moduleId: string, flowId: string) {
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
      photo_urls,
      mood_tags,
    })
    .eq('id', cardId)
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
}

export async function deleteCard(cardId: string, moduleId: string, flowId: string) {
  const supabase = createServerClient()
  await supabase.from('cards').delete().eq('id', cardId)
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
}
