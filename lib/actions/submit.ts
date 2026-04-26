'use server'

import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase/server'
import { SelectionEmail } from '@/emails/SelectionEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

type ModuleSubmission =
  | { type: 'decision'; moduleId: string; chosenCardIds: string[] }
  | { type: 'quiz'; moduleId: string; chosenOptionText: string }

export async function submitSelection(
  flowId: string,
  submissions: ModuleSubmission[],
  message: string | null,
) {
  const supabase = createServerClient()

  // Create the selection record
  const { data: selection, error: selError } = await supabase
    .from('selections')
    .insert({ flow_id: flowId, message })
    .select('id')
    .single()
  if (selError) throw new Error(selError.message)

  // Create selection_answers for each module
  const answers = submissions.map((sub) =>
    sub.type === 'decision'
      ? {
          selection_id: selection.id,
          module_id: sub.moduleId,
          module_type: 'decision',
          chosen_card_ids: sub.chosenCardIds,
          chosen_option_text: null,
        }
      : {
          selection_id: selection.id,
          module_id: sub.moduleId,
          module_type: 'quiz',
          chosen_card_ids: null,
          chosen_option_text: sub.chosenOptionText,
        },
  )

  await supabase.from('selection_answers').insert(answers)

  // Fetch data needed for the email
  const { data: flow } = await supabase
    .from('flows')
    .select('title')
    .eq('id', flowId)
    .single()

  const emailAnswers: Parameters<typeof SelectionEmail>[0]['answers'] = []

  for (const sub of submissions) {
    if (sub.type === 'decision') {
      const { data: mod } = await supabase
        .from('decision_modules')
        .select('prompt_text')
        .eq('id', sub.moduleId)
        .single()
      const { data: cards } = await supabase
        .from('cards')
        .select('title, location, price_range, mood_tags')
        .in('id', sub.chosenCardIds)
      emailAnswers.push({
        type: 'decision',
        prompt: mod?.prompt_text ?? '',
        cards: cards ?? [],
      })
    } else {
      const { data: mod } = await supabase
        .from('quiz_modules')
        .select('title')
        .eq('id', sub.moduleId)
        .single()

      // chosen_option_text is "Question: Answer\nQuestion2: Answer2"
      const pairs = sub.chosenOptionText
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(': ')
          return idx > -1
            ? { question: line.slice(0, idx), answer: line.slice(idx + 2) }
            : { question: line, answer: '' }
        })

      emailAnswers.push({ type: 'quiz', title: mod?.title ?? '', answers: pairs })
    }
  }

  const toEmail = process.env.CREATOR_EMAIL ?? 'cykn128@gmail.com'

  await resend.emails.send({
    from: 'Date Night <hello@datenight.love>',
    to: toEmail,
    subject: `She chose! — ${flow?.title ?? 'Date Night'}`,
    react: SelectionEmail({
      flowTitle: flow?.title ?? '',
      message,
      answers: emailAnswers,
    }),
  })

  return { selectionId: selection.id }
}
