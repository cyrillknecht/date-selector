import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Layers, HelpCircle, Globe, EyeOff, Heart } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import {
  updateFlow,
  publishFlow,
  unpublishFlow,
  archiveFlow,
  confirmDate,
} from '@/lib/actions/flows'
import {
  createDecisionModule,
  createQuizModule,
  deleteDecisionModule,
  deleteQuizModule,
} from '@/lib/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CopyLinkButton } from '@/components/creator/CopyLinkButton'

export const dynamic = 'force-dynamic'

export default async function FlowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: flow } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .single()

  if (!flow) notFound()

  const [{ data: decisionModules }, { data: quizModules }, { data: selection }] = await Promise.all([
    supabase
      .from('decision_modules')
      .select('id, prompt_text, allow_multi_select, position')
      .eq('flow_id', id)
      .order('position'),
    supabase
      .from('quiz_modules')
      .select('id, title, position')
      .eq('flow_id', id)
      .order('position'),
    supabase
      .from('selections')
      .select('id, message, submitted_at, selection_answers(module_type, chosen_card_ids)')
      .eq('flow_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Fetch all decision module cards for the confirm-date card picker
  const decisionIds = decisionModules?.map((m) => m.id) ?? []
  const { data: allCards } = decisionIds.length > 0
    ? await supabase
        .from('cards')
        .select('id, title, decision_module_id, photo_urls')
        .in('decision_module_id', decisionIds)
        .order('position')
    : { data: [] }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const shareUrl = flow.token ? `${appUrl}/${flow.token}` : null

  const updateFlowAction = updateFlow.bind(null, id)
  const publishAction = publishFlow.bind(null, id)
  const unpublishAction = unpublishFlow.bind(null, id)
  const archiveAction = archiveFlow.bind(null, id)
  const addDecisionAction = createDecisionModule.bind(null, id)
  const addQuizAction = createQuizModule.bind(null, id)
  const confirmDateAction = confirmDate.bind(null, id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/creator/dashboard" className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors">
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <span className="text-stone-300">/</span>
        <Badge variant={flow.status as 'draft' | 'published' | 'archived'}>{flow.status}</Badge>
      </div>

      {/* Flow settings */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <h2 className="font-serif font-semibold text-stone-800">Flow Settings</h2>
        <form action={updateFlowAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={flow.title} required placeholder="Our Date Night" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intro_message">Intro message <span className="text-stone-400 font-normal">(optional)</span></Label>
            <Textarea
              id="intro_message"
              name="intro_message"
              defaultValue={flow.intro_message ?? ''}
              placeholder="Hey love, pick your favorites and I'll make it happen..."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outro_message">Outro message <span className="text-stone-400 font-normal">(optional)</span></Label>
            <Textarea
              id="outro_message"
              name="outro_message"
              defaultValue={flow.outro_message ?? ''}
              placeholder="Can't wait to surprise you!"
              rows={2}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Save settings</Button>
        </form>
      </section>

      {/* Publish section */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif font-semibold text-stone-800">Sharing</h2>
            {flow.status === 'published' && shareUrl ? (
              <p className="text-sm text-stone-500 mt-1 font-mono break-all">{shareUrl}</p>
            ) : (
              <p className="text-sm text-stone-500 mt-1">Publish to generate a private link for your girlfriend.</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {flow.status === 'published' && shareUrl && (
              <CopyLinkButton url={shareUrl} />
            )}
            {flow.status !== 'published' ? (
              <form action={publishAction}>
                <Button type="submit" size="sm" className="gap-1.5 bg-rose-500 hover:bg-rose-600 text-white">
                  <Globe className="size-4" />
                  Publish
                </Button>
              </form>
            ) : (
              <form action={unpublishAction}>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                  <EyeOff className="size-4" />
                  Unpublish
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Selection + Confirm Date */}
      {flow.status === 'published' && (
        <section className="rounded-2xl border border-rose-100 bg-white p-6 space-y-5">
          <h2 className="font-serif font-semibold text-stone-800 flex items-center gap-2">
            <Heart className="size-5 text-rose-400" />
            Confirm Date
          </h2>

          {selection ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-stone-50 border border-stone-100 p-4 text-sm text-stone-600 space-y-1">
                <p className="font-medium text-stone-800">She submitted her picks 🎉</p>
                {selection.message && (
                  <p className="italic text-stone-500">&ldquo;{selection.message}&rdquo;</p>
                )}
                <p className="text-xs text-stone-400">
                  {new Date(selection.submitted_at).toLocaleString('de-CH', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Chosen cards */}
              {(selection.selection_answers ?? [])
                .filter((a) => a.module_type === 'decision' && (a.chosen_card_ids ?? []).length > 0)
                .flatMap((a) => a.chosen_card_ids ?? [])
                .map((cardId) => {
                  const card = (allCards ?? []).find((c) => c.id === cardId)
                  if (!card) return null
                  return (
                    <div key={cardId} className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                      {card.photo_urls[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.photo_urls[0]} alt={card.title} className="size-10 rounded-lg object-cover shrink-0" />
                      )}
                      <p className="text-sm font-medium text-stone-800">{card.title}</p>
                    </div>
                  )
                })
              }
            </div>
          ) : (
            <p className="text-sm text-stone-400">Waiting for her to submit her picks...</p>
          )}

          {/* Confirm form — show even without selection, allow pre-confirming */}
          {flow.confirmed_card_id ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 space-y-1">
              <p className="font-medium">Date confirmed ✓</p>
              {flow.confirmed_at && (
                <p>{new Date(flow.confirmed_at).toLocaleString('de-CH', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}</p>
              )}
              {flow.meeting_point && <p>{flow.meeting_point}</p>}
            </div>
          ) : null}

          <form action={confirmDateAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirmed_card_id">Activity / Card</Label>
              <select
                id="confirmed_card_id"
                name="confirmed_card_id"
                required
                defaultValue={flow.confirmed_card_id ?? ''}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="" disabled>Select a card…</option>
                {(allCards ?? []).map((card) => (
                  <option key={card.id} value={card.id}>{card.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmed_at">Date &amp; Time</Label>
              <Input
                id="confirmed_at"
                name="confirmed_at"
                type="datetime-local"
                required
                defaultValue={flow.confirmed_at
                  ? new Date(flow.confirmed_at).toISOString().slice(0, 16)
                  : '2026-05-03T10:00'
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting_point">Meeting point <span className="text-stone-400 font-normal">(optional)</span></Label>
              <Input
                id="meeting_point"
                name="meeting_point"
                placeholder="Hauptbahnhof Zürich, Gleis 9"
                defaultValue={flow.meeting_point ?? ''}
              />
            </div>

            <Button type="submit" size="sm" className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5">
              <Heart className="size-4" />
              {flow.confirmed_card_id ? 'Update confirmation' : 'Confirm date'}
            </Button>
          </form>
        </section>
      )}

      {/* Decision Modules */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-stone-800 flex items-center gap-2">
            <Layers className="size-5 text-rose-400" />
            Decision Modules
          </h2>
          <form action={addDecisionAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </div>

        {(!decisionModules || decisionModules.length === 0) ? (
          <p className="text-sm text-stone-400 py-2">No decision modules yet. Add one to let her pick from your curated cards.</p>
        ) : (
          <div className="space-y-2">
            {decisionModules.map((mod) => {
              const deleteAction = deleteDecisionModule.bind(null, mod.id, id)
              return (
                <div key={mod.id} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{mod.prompt_text}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {mod.allow_multi_select ? 'Multi-select' : 'Single select'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Link
                      href={`/creator/flows/${id}/modules/decision/${mod.id}`}
                      className="text-sm text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                    >
                      Edit cards
                    </Link>
                    <form action={deleteAction}>
                      <button type="submit" className="p-1.5 rounded text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Quiz Modules */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-semibold text-stone-800 flex items-center gap-2">
            <HelpCircle className="size-5 text-amber-400" />
            Quiz Modules
          </h2>
          <form action={addQuizAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </div>

        {(!quizModules || quizModules.length === 0) ? (
          <p className="text-sm text-stone-400 py-2">{"No quiz modules yet. Add questions to learn what she's in the mood for."}</p>
        ) : (
          <div className="space-y-2">
            {quizModules.map((mod) => {
              const deleteAction = deleteQuizModule.bind(null, mod.id, id)
              return (
                <div key={mod.id} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
                  <p className="text-sm font-medium text-stone-800 truncate min-w-0">{mod.title}</p>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Link
                      href={`/creator/flows/${id}/modules/quiz/${mod.id}`}
                      className="text-sm text-amber-500 hover:text-amber-600 font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                    >
                      Edit questions
                    </Link>
                    <form action={deleteAction}>
                      <button type="submit" className="p-1.5 rounded text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Danger zone */}
      {flow.status !== 'archived' && (
        <section className="rounded-2xl border border-red-100 bg-red-50/50 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">Archive this flow</p>
            <p className="text-xs text-stone-400 mt-0.5">Removes it from your active list.</p>
          </div>
          <form action={archiveAction}>
            <Button type="submit" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
              Archive
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
