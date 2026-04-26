import { cn } from '@/lib/utils'

type BadgeVariant = 'draft' | 'published' | 'archived' | 'default'

const variants: Record<BadgeVariant, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-green-100 text-green-700 border-green-200',
  archived: 'bg-stone-100 text-stone-500 border-stone-200',
  default: 'bg-stone-100 text-stone-700 border-stone-200',
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}
