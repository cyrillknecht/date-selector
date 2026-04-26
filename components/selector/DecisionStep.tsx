'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, MapPin, DollarSign } from 'lucide-react'
import { t } from '@/i18n/selector'

type Card = {
  id: string
  title: string
  description: string | null
  location: string | null
  price_range: string | null
  mood_tags: string[]
  photo_urls: string[]
}

interface DecisionStepProps {
  promptText: string
  allowMultiSelect: boolean
  cards: Card[]
  onAnswer: (cardIds: string[]) => void
  initialSelection?: string[]
}

export function DecisionStep({
  promptText,
  allowMultiSelect,
  cards,
  onAnswer,
  initialSelection = [],
}: DecisionStepProps) {
  const [selected, setSelected] = useState<string[]>(initialSelection)
  const prefersReducedMotion = useReducedMotion()

  function toggle(id: string) {
    const next = allowMultiSelect
      ? selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
      : selected.includes(id) ? [] : [id]
    setSelected(next)
    onAnswer(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xl font-serif font-semibold text-stone-900">{promptText}</p>
        <p className="text-sm text-stone-400 mt-1">
          {allowMultiSelect ? t.multiSelectHint : t.singleSelectHint}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const isSelected = selected.includes(card.id)
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              className={`relative rounded-2xl overflow-hidden border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.15)]'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Photo */}
              <div className="aspect-[4/3] bg-stone-100 relative">
                {card.photo_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.photo_urls[0]}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">💕</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                    <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                      <Check className="size-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-white">
                <p className="font-medium text-stone-900 text-sm leading-tight">{card.title}</p>
                {card.description && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{card.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {card.location && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-stone-500">
                      <MapPin className="size-3" />{card.location}
                    </span>
                  )}
                  {card.price_range && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-stone-500">
                      <DollarSign className="size-3" />{card.price_range}
                    </span>
                  )}
                </div>
                {card.mood_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {card.mood_tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
