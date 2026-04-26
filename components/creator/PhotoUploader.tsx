'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2, Film } from 'lucide-react'

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v']
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v'

function isVideo(url: string) {
  const lower = url.toLowerCase().split('?')[0]
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext))
}

interface PhotoUploaderProps {
  initialUrls: string[]
  name: string
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
      <input type="hidden" name={name} value={urls.join('\n')} />

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative size-20 rounded-lg overflow-hidden border border-stone-200 group">
              {isVideo(url) ? (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <Film className="size-6 text-stone-400" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
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

      <div>
        <label className={`inline-flex items-center gap-2 cursor-pointer text-sm px-3 py-2 rounded-lg border border-dashed transition-colors ${
          uploading
            ? 'border-stone-200 text-stone-300 cursor-not-allowed'
            : 'border-stone-300 text-stone-500 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50'
        }`}>
          {uploading
            ? <><Loader2 className="size-4 animate-spin" /> Uploading…</>
            : <><ImagePlus className="size-4" /> Add photo / video</>
          }
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
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
