import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, HelpCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { updateQuizModule } from '@/lib/actions/modules'
import { createQuestion, updateQuestion, deleteQuestion } from '@/lib/actions/questions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export const dynamic = 'force-dynamic'

export default async function QuizModuleEditorPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: flowId, moduleId } = await params
  const supabase = createServerClient()

  const { data: mod } = await supabase
    .from('quiz_modules')
    .select('*')
    .eq('id', moduleId)
    .eq('flow_id', flowId)
    .single()

  if (!mod) notFound()

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_module_id', moduleId)
    .order('position')

  const updateModAction = updateQuizModule.bind(null, moduleId, flowId)
  const addQuestionAction = createQuestion.bind(null, moduleId, flowId)

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/creator/flows/${flowId}`} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors">
          <ArrowLeft className="size-4" />
          Back to flow
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-600 font-medium">Quiz Module</span>
      </div>

      {/* Module settings */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <h2 className="font-serif font-semibold text-stone-800">Module Settings</h2>
        <form action={updateModAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={mod.title} required placeholder="Mood check-in" />
          </div>
          <Button type="submit" variant="outline" size="sm">Save settings</Button>
        </form>
      </section>

      {/* Questions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-stone-800">Questions ({questions?.length ?? 0})</h2>
          <form action={addQuestionAction}>
            <Button type="submit" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white" size="sm">
              <Plus className="size-4" />
              Add question
            </Button>
          </form>
        </div>

        {(!questions || questions.length === 0) && (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 p-10 text-center">
            <HelpCircle className="size-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-400">Add questions to understand her mood and preferences.</p>
          </div>
        )}

        <div className="grid gap-4">
          {questions?.map((question) => {
            const updateAction = updateQuestion.bind(null, question.id, moduleId, flowId)
            const deleteAction = deleteQuestion.bind(null, question.id, moduleId, flowId)
            return (
              <div key={question.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-stone-800">{question.question_text}</h3>
                  <form action={deleteAction}>
                    <button type="submit" className="p-1.5 rounded text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
                <form action={updateAction} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Question</Label>
                    <Input name="question_text" defaultValue={question.question_text} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Options <span className="text-stone-400 font-normal">(one per line)</span></Label>
                    <Textarea
                      name="options"
                      defaultValue={question.options.join('\n')}
                      rows={Math.max(3, question.options.length + 1)}
                      placeholder="Cozy restaurant&#10;Street food adventure&#10;Home-cooked meal"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="outline" size="sm">Save question</Button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
