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

async function nextDecisionPosition(flowId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('decision_modules')
    .select('position')
    .eq('flow_id', flowId)
    .order('position', { ascending: false })
    .limit(1)
  return ((data?.[0]?.position ?? -1) as number) + 1
}

async function nextQuizPosition(flowId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('quiz_modules')
    .select('position')
    .eq('flow_id', flowId)
    .order('position', { ascending: false })
    .limit(1)
  return ((data?.[0]?.position ?? -1) as number) + 1
}

export async function createDecisionModule(flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  const position = await nextDecisionPosition(flowId)
  await supabase.from('decision_modules').insert({
    flow_id: flowId,
    position,
    prompt_text: 'Choose your favourite',
    allow_multi_select: false,
  })
  revalidatePath(`/creator/flows/${flowId}`)
}

export async function createQuizModule(flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  const position = await nextQuizPosition(flowId)
  await supabase.from('quiz_modules').insert({
    flow_id: flowId,
    position,
    title: 'New Quiz',
  })
  revalidatePath(`/creator/flows/${flowId}`)
}

export async function updateDecisionModule(moduleId: string, flowId: string, formData: FormData) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase
    .from('decision_modules')
    .update({
      prompt_text: formData.get('prompt_text') as string,
      allow_multi_select: formData.get('allow_multi_select') === 'true',
    })
    .eq('id', moduleId)
  revalidatePath(`/creator/flows/${flowId}/modules/decision/${moduleId}`)
  revalidatePath(`/creator/flows/${flowId}`)
}

export async function updateQuizModule(moduleId: string, flowId: string, formData: FormData) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase
    .from('quiz_modules')
    .update({ title: formData.get('title') as string })
    .eq('id', moduleId)
  revalidatePath(`/creator/flows/${flowId}/modules/quiz/${moduleId}`)
  revalidatePath(`/creator/flows/${flowId}`)
}

export async function deleteDecisionModule(moduleId: string, flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase.from('decision_modules').delete().eq('id', moduleId)
  revalidatePath(`/creator/flows/${flowId}`)
}

export async function deleteQuizModule(moduleId: string, flowId: string) {
  await requireAuth()
  const supabase = createServerClient()
  await supabase.from('quiz_modules').delete().eq('id', moduleId)
  revalidatePath(`/creator/flows/${flowId}`)
}
