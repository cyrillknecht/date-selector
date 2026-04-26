'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function createFlow() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('flows')
    .insert({ title: 'Untitled Flow', status: 'draft' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  redirect(`/creator/flows/${data.id}`)
}

export async function updateFlow(id: string, formData: FormData) {
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
  const supabase = createServerClient()
  await supabase
    .from('flows')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/creator/dashboard')
  redirect('/creator/dashboard')
}

export async function publishFlow(id: string) {
  const supabase = createServerClient()
  const token = crypto.randomUUID()
  await supabase
    .from('flows')
    .update({ status: 'published', published_at: new Date().toISOString(), token })
    .eq('id', id)
  revalidatePath(`/creator/flows/${id}`)
}

export async function unpublishFlow(id: string) {
  const supabase = createServerClient()
  await supabase
    .from('flows')
    .update({ status: 'draft', published_at: null, token: null })
    .eq('id', id)
  revalidatePath(`/creator/flows/${id}`)
}
