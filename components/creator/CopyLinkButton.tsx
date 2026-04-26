'use client'

import { useState } from 'react'
import { Check, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="size-4 text-green-600" /> : <Link className="size-4" />}
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  )
}
