import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Image } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { updateDecisionModule } from '@/lib/actions/modules'
import { createCard, updateCard, deleteCard } from '@/lib/actions/cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default async function DecisionModuleEditorPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: flowId, moduleId } = await params
  const supabase = createServerClient()

  const { data: mod } = await supabase
    .from('decision_modules')
    .select('*')
    .eq('id', moduleId)
    .eq('flow_id', flowId)
    .single()

  if (!mod) notFound()

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('decision_module_id', moduleId)
    .order('position')

  const updateModAction = updateDecisionModule.bind(null, moduleId, flowId)
  const addCardAction = createCard.bind(null, moduleId, flowId)

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/creator/flows/${flowId}`} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors">
          <ArrowLeft className="size-4" />
          Back to flow
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-600 font-medium">Decision Module</span>
      </div>

      {/* Module settings */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <h2 className="font-serif font-semibold text-stone-800">Module Settings</h2>
        <form action={updateModAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prompt_text">Prompt</Label>
            <Input
              id="prompt_text"
              name="prompt_text"
              defaultValue={mod.prompt_text}
              placeholder="Choose your favourite restaurant..."
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allow_multi_select"
              name="allow_multi_select"
              value="true"
              defaultChecked={mod.allow_multi_select}
              className="size-4 rounded border-stone-300 text-rose-500 focus:ring-rose-400"
            />
            <Label htmlFor="allow_multi_select" className="cursor-pointer">
              Allow multiple selections
            </Label>
          </div>
          <Button type="submit" variant="outline" size="sm">Save settings</Button>
        </form>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-stone-800">Cards ({cards?.length ?? 0})</h2>
          <form action={addCardAction}>
            <Button type="submit" className="gap-1.5 bg-rose-500 hover:bg-rose-600 text-white" size="sm">
              <Plus className="size-4" />
              Add card
            </Button>
          </form>
        </div>

        {(!cards || cards.length === 0) && (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 p-10 text-center">
            <Image className="size-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-400">Add cards to give her options to pick from.</p>
          </div>
        )}

        <div className="grid gap-4">
          {cards?.map((card) => {
            const updateAction = updateCard.bind(null, card.id, moduleId, flowId)
            const deleteAction = deleteCard.bind(null, card.id, moduleId, flowId)
            return (
              <div key={card.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-stone-800">{card.title}</h3>
                  <form action={deleteAction}>
                    <button type="submit" className="p-1.5 rounded text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
                <form action={updateAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input name="title" defaultValue={card.title} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input name="location" defaultValue={card.location ?? ''} placeholder="e.g. Zurich Altstadt" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price range</Label>
                    <Input name="price_range" defaultValue={card.price_range ?? ''} placeholder="e.g. $$, €20-40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mood tags <span className="text-stone-400 font-normal">(comma-separated)</span></Label>
                    <Input name="mood_tags" defaultValue={card.mood_tags.join(', ')} placeholder="cozy, romantic, outdoor" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Description</Label>
                    <Textarea name="description" defaultValue={card.description ?? ''} rows={2} placeholder="A short description..." />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Photo URLs <span className="text-stone-400 font-normal">(one per line)</span></Label>
                    <Textarea
                      name="photo_urls"
                      defaultValue={card.photo_urls.join('\n')}
                      rows={3}
                      placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" variant="outline" size="sm">Save card</Button>
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
