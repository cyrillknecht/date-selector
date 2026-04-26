'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface PhotoUploaderProps {
  initialUrls: string[]
  name: string // the hidden input name consumed by the server action
}

export function PhotoUploader({ initialUrls, name }: PhotoUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Upload failed')
        break
      }
      newUrls.push(json.url as string)
    }

    setUrls((prev) => [...prev, ...newUrls])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      {/* Hidden input carries the current URLs to the server action */}
      <input type="hidden" name={name} value={urls.join('\n')} />

      {/* Thumbnail grid */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative size-20 rounded-lg overflow-hidden border border-stone-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="size-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <label className={`inline-flex items-center gap-2 cursor-pointer text-sm px-3 py-2 rounded-lg border border-dashed transition-colors ${
          uploading
            ? 'border-stone-200 text-stone-300 cursor-not-allowed'
            : 'border-stone-300 text-stone-500 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50'
        }`}>
          {uploading
            ? <><Loader2 className="size-4 animate-spin" /> Uploading…</>
            : <><ImagePlus className="size-4" /> Add photo</>
          }
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}
