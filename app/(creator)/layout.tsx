import Link from 'next/link'
import { Heart, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link href="/creator/dashboard" className="flex items-center gap-2 font-serif text-lg font-semibold text-stone-800 hover:text-rose-500 transition-colors">
            <Heart className="size-5 fill-rose-400 text-rose-400" />
            Date Night
          </Link>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-stone-500 hover:text-stone-800">
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
