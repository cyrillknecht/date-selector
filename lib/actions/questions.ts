'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createQuestion(moduleId: string, flowId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('quiz_questions')
    .select('position')
    .eq('quiz_module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1)
  const position = ((data?.[0]?.position ?? -1) as number) + 1
  await supabase.from('quiz_questions').insert({
    quiz_module_id: moduleId,
    position,
    question_text: 'New Question',
    options: ['Option A', 'Option B'],
  })
  revalidatePath(`/creator/flows/${flowId}/modules/quiz/${moduleId}`)
}

export async function updateQuestion(questionId: string, moduleId: string, flowId: string, formData: FormData) {
  const supabase = createServerClient()
  const optionsRaw = (formData.get('options') as string) || ''
  const options = optionsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
  await supabase
    .from('quiz_questions')
    .update({
      question_text: formData.get('question_text') as string,
      options,
    })
    .eq('id', questionId)
  revalidatePath(`/creator/flows/${flowId}/modules/quiz/${moduleId}`)
}

export async function deleteQuestion(questionId: string, moduleId: string, flowId: string) {
  const supabase = createServerClient()
  await supabase.from('quiz_questions').delete().eq('id', questionId)
  revalidatePath(`/creator/flows/${flowId}/modules/quiz/${moduleId}`)
}
