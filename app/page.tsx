import { redirect } from 'next/navigation'

// Root redirects to the creator dashboard.
// Unauthenticated users will be redirected to /login by middleware (Phase 3).
export default function RootPage() {
  redirect('/creator/dashboard')
}
