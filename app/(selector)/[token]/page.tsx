import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { SelectorFlow } from '@/components/selector/SelectorFlow'

export default async function SelectorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServerClient()

  // Fetch the published flow by token
  const { data: flow } = await supabase
    .from('flows')
    .select('id, title, intro_message, outro_message, status')
    .eq('token', token)
    .eq('status', 'published')
    .single()

  if (!flow) notFound()

  // Fetch all modules in parallel
  const [{ data: decisionMods }, { data: quizMods }] = await Promise.all([
    supabase
      .from('decision_modules')
      .select('id, prompt_text, allow_multi_select, position')
      .eq('flow_id', flow.id)
      .order('position'),
    supabase
      .from('quiz_modules')
      .select('id, title, position')
      .eq('flow_id', flow.id)
      .order('position'),
  ])

  // Fetch cards and questions in parallel
  const decisionIds = decisionMods?.map((m) => m.id) ?? []
  const quizIds = quizMods?.map((m) => m.id) ?? []

  const [{ data: cards }, { data: questions }] = await Promise.all([
    decisionIds.length > 0
      ? supabase
          .from('cards')
          .select('id, decision_module_id, title, description, location, price_range, mood_tags, photo_urls, position')
          .in('decision_module_id', decisionIds)
          .order('position')
      : Promise.resolve({ data: [] }),
    quizIds.length > 0
      ? supabase
          .from('quiz_questions')
          .select('id, quiz_module_id, question_text, options, position')
          .in('quiz_module_id', quizIds)
          .order('position')
      : Promise.resolve({ data: [] }),
  ])

  // Build combined module list sorted by position (decision first on tie)
  type AnyModule =
    | { type: 'decision'; id: string; position: number; promptText: string; allowMultiSelect: boolean; cards: typeof cards }
    | { type: 'quiz'; id: string; position: number; title: string; questions: typeof questions }

  const allModules: AnyModule[] = [
    ...(decisionMods ?? []).map((m) => ({
      type: 'decision' as const,
      id: m.id,
      position: m.position,
      promptText: m.prompt_text,
      allowMultiSelect: m.allow_multi_select,
      cards: (cards ?? []).filter((c) => c.decision_module_id === m.id),
    })),
    ...(quizMods ?? []).map((m) => ({
      type: 'quiz' as const,
      id: m.id,
      position: m.position,
      title: m.title,
      questions: (questions ?? []).filter((q) => q.quiz_module_id === m.id),
    })),
  ].sort((a, b) => a.position - b.position || (a.type === 'decision' ? -1 : 1))

  // Filter out empty modules
  const modules = allModules.filter((m) =>
    m.type === 'decision' ? m.cards && m.cards.length > 0 : m.questions && m.questions.length > 0,
  )

  return (
    <SelectorFlow
      flowId={flow.id}
      introMessage={flow.intro_message}
      outroMessage={flow.outro_message}
      modules={modules as Parameters<typeof SelectorFlow>[0]['modules']}
    />
  )
}
