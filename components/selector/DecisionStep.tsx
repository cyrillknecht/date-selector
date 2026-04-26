'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
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

function CardExpandPanel({ card }: { card: Card }) {
  return (
    <div className="px-3 pb-3 bg-white space-y-2">
      {/* Photo gallery */}
      {card.photo_urls.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {card.photo_urls.slice(1).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-16 w-16 object-cover rounded-lg shrink-0"
            />
          ))}
        </div>
      )}

      {/* Full description */}
      {card.description && (
        <p className="text-xs text-stone-600 leading-relaxed">{card.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
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

      {/* Mood tags */}
      {card.mood_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.mood_tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DecisionStep({
  promptText,
  allowMultiSelect,
  cards,
  onAnswer,
  initialSelection = [],
}: DecisionStepProps) {
  const [selected, setSelected] = useState<string[]>(initialSelection)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  function toggle(id: string) {
    const next = allowMultiSelect
      ? selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
      : selected.includes(id) ? [] : [id]
    setSelected(next)
    onAnswer(next)
  }

  function toggleExpand(id: string) {
    setExpandedCardId((prev) => (prev === id ? null : id))
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
          const isExpanded = expandedCardId === card.id
          const isHovered = hoveredCardId === card.id
          const hasExtra = card.description || card.location || card.price_range || card.mood_tags.length > 0 || card.photo_urls.length > 1

          return (
            <motion.div
              key={card.id}
              layout={!prefersReducedMotion}
              className={`relative rounded-2xl overflow-hidden border-2 text-left transition-colors duration-200 ${
                isSelected
                  ? 'border-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.15)]'
                  : 'border-stone-200'
              } ${isExpanded ? 'col-span-2 sm:col-span-1' : ''}`}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              {/* Main card — click selects on desktop */}
              <button
                type="button"
                onClick={() => toggle(card.id)}
                className="w-full text-left"
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

                {/* Title row */}
                <div className="px-3 pt-3 pb-1 bg-white">
                  <p className="font-medium text-stone-900 text-sm leading-tight">{card.title}</p>
                </div>
              </button>

              {/* Expand toggle — only shown when NOT hovered (i.e. on mobile) */}
              {hasExtra && (
                <button
                  type="button"
                  onClick={() => toggleExpand(card.id)}
                  className="sm:hidden w-full flex items-center justify-center pb-2 text-stone-400 active:text-stone-600"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              )}

              {/* Desktop: show expanded panel on hover (hidden on mobile via sm:block) */}
              {hasExtra && (
                <div className="hidden sm:block">
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        key="desktop-expand"
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <CardExpandPanel card={card} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile: show expanded panel when isExpanded (hidden on desktop via sm:hidden) */}
              {hasExtra && (
                <div className="sm:hidden">
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="mobile-expand"
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <CardExpandPanel card={card} />
                        <div className="px-3 pb-3">
                          <button
                            type="button"
                            onClick={() => toggle(card.id)}
                            className={`w-full rounded-xl py-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-rose-500 text-white'
                                : 'bg-stone-100 text-stone-700 active:bg-stone-200'
                            }`}
                          >
                            {isSelected ? '✓ Gwählt' : 'Wähle'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Spacer for mobile when no expand button */}
              {!hasExtra && <div className="pb-3 bg-white" />}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
