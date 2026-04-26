'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import { t } from '@/i18n/selector'
import { PolaroidBackground } from './PolaroidBackground'
import { EasterEgg } from './EasterEgg'

type ConfirmedCard = {
  id: string
  title: string
  description: string | null
  location: string | null
  price_range: string | null
  mood_tags: string[]
  photo_urls: string[]
}

interface ConfirmedDatePageProps {
  outroMessage: string | null
  confirmedCard: ConfirmedCard
  confirmedAt: string
  meetingPoint: string | null
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ConfirmedDatePage({
  outroMessage,
  confirmedCard,
  confirmedAt,
  meetingPoint,
}: ConfirmedDatePageProps) {
  return (
    <div className="relative min-h-dvh bg-stone-50 flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      <PolaroidBackground />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-stone-900">{t.confirmedHeading}</h1>
          <p className="text-stone-500 text-sm">{t.confirmedSub}</p>
        </div>

        {/* Confirmed card */}
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {confirmedCard.photo_urls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={confirmedCard.photo_urls[0]}
              alt={confirmedCard.title}
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-rose-50 flex items-center justify-center">
              <span className="text-6xl">💕</span>
            </div>
          )}

          <div className="p-5 space-y-3">
            <h2 className="font-serif text-xl font-semibold text-stone-900">{confirmedCard.title}</h2>

            {confirmedCard.description && (
              <p className="text-sm text-stone-600 leading-relaxed">{confirmedCard.description}</p>
            )}

            {confirmedCard.mood_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {confirmedCard.mood_tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date + location details */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="size-4 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{t.confirmedWhen}</p>
              <p className="text-sm text-stone-800 font-medium mt-0.5">{formatDateTime(confirmedAt)}</p>
            </div>
          </div>

          {(meetingPoint || confirmedCard.location) && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="size-4 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{t.confirmedWhere}</p>
                <p className="text-sm text-stone-800 font-medium mt-0.5">
                  {meetingPoint ?? confirmedCard.location}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Outro message */}
        <div className="text-center">
          <p className="font-serif text-lg text-stone-700 italic">
            {outroMessage ?? t.defaultOutro}
          </p>
        </div>
      </motion.div>

      <EasterEgg />
    </div>
  )
}
