import Link from 'next/link'
import { Plus, ChevronRight, LayoutList, BookOpen } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { createFlow, archiveFlow } from '@/lib/actions/flows'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: flows } = await supabase
    .from('flows')
    .select('id, title, status, created_at, published_at')
    .order('created_at', { ascending: false })

  const active = flows?.filter((f) => f.status !== 'archived') ?? []
  const archived = flows?.filter((f) => f.status === 'archived') ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-stone-900">Your Flows</h1>
          <p className="text-sm text-stone-500 mt-1">Build curated date night experiences</p>
        </div>
        <form action={createFlow}>
          <Button type="submit" className="gap-1.5 bg-rose-500 hover:bg-rose-600 text-white">
            <Plus className="size-4" />
            New Flow
          </Button>
        </form>
      </div>

      {active.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <LayoutList className="size-6 text-rose-400" />
          </div>
          <p className="text-stone-500 text-sm">No flows yet. Create your first one!</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="grid gap-3">
          {active.map((flow) => (
            <div key={flow.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-300 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <BookOpen className="size-4 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{flow.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(flow.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <Badge variant={flow.status as 'draft' | 'published' | 'archived'}>
                  {flow.status}
                </Badge>
                <form action={archiveFlow.bind(null, flow.id)}>
                  <button type="submit" className="text-xs text-stone-400 hover:text-stone-600 transition-colors px-2 py-1 rounded hover:bg-stone-50">
                    Archive
                  </button>
                </form>
                <Link
                  href={`/creator/flows/${flow.id}`}
                  className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 font-medium"
                >
                  Edit
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors list-none flex items-center gap-1.5">
            <ChevronRight className="size-4 group-open:rotate-90 transition-transform" />
            Archived ({archived.length})
          </summary>
          <div className="grid gap-2 mt-3 pl-5">
            {archived.map((flow) => (
              <div key={flow.id} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-3 opacity-70">
                <p className="text-sm text-stone-600">{flow.title}</p>
                <Badge variant="archived">archived</Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
