'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Check, MapPin, DollarSign,
  ChevronDown, ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import { t } from '@/i18n/selector'

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v']
function isVideo(url: string) {
  const lower = url.toLowerCase().split('?')[0]
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext))
}

type Card = {
  id: string
  title: string
  description: string | null
  location: string | null
  price_range: string | null
  mood_tags: string[]
  photo_urls: string[]
  url?: string | null
}

interface DecisionStepProps {
  promptText: string
  allowMultiSelect: boolean
  cards: Card[]
  onAnswer: (cardIds: string[]) => void
  initialSelection?: string[]
}

function MediaCarousel({ urls, title }: { urls: string[]; title: string }) {
  const [index, setIndex] = useState(0)
  const total = urls.length

  if (!total) {
    return (
      <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center">
        <span className="text-4xl">💕</span>
      </div>
    )
  }

  const url = urls[index]

  return (
    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
      {isVideo(url) ? (
        <video
          key={url}
          src={url}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          autoPlay
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt={title} className="w-full h-full object-cover" />
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + total) % total) }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-0.5 text-white transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % total) }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-0.5 text-white transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === index ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CardExpandPanel({ card, onSelect, isSelected }: { card: Card; onSelect: () => void; isSelected: boolean }) {
  return (
    <div className="px-3 pb-3 bg-white space-y-2">
      {card.description && (
        <p className="text-xs text-stone-600 leading-relaxed">{card.description}</p>
      )}

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

      {card.mood_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.mood_tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {card.url && (
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3" />
          Mehr Info
        </a>
      )}

      {/* Mobile select button — only rendered inside the mobile expand panel */}
      <button
        type="button"
        onClick={onSelect}
        className={`sm:hidden w-full rounded-xl py-2 text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-rose-500 text-white'
            : 'bg-stone-100 text-stone-700 active:bg-stone-200'
        }`}
      >
        {isSelected ? '✓ Gwählt' : 'Wähle'}
      </button>
    </div>
  )
}

const expandVariants = {
  collapsed: { opacity: 0, height: 0 },
  expanded: { opacity: 1, height: 'auto' },
}

const expandTransition = {
  height: { type: 'spring', stiffness: 300, damping: 32, mass: 0.8 },
  opacity: { duration: 0.15, ease: 'easeOut' },
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
          const hasExtra = card.description || card.location || card.price_range || card.url || card.mood_tags.length > 0

          return (
            <div
              key={card.id}
              className={`relative rounded-2xl overflow-hidden border-2 text-left transition-colors duration-200 ${
                isSelected
                  ? 'border-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.15)]'
                  : 'border-stone-200'
              }`}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              {/* Main tap — always selects */}
              <button
                type="button"
                onClick={() => toggle(card.id)}
                className="w-full text-left"
              >
                <MediaCarousel urls={card.photo_urls} title={card.title} />

                <div className="relative px-3 pt-2.5 pb-1 bg-white">
                  {isSelected && (
                    <div className="absolute top-2 right-2 size-5 rounded-full bg-rose-500 flex items-center justify-center shadow">
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <p className="font-medium text-stone-900 text-sm leading-tight pr-6">{card.title}</p>
                </div>
              </button>

              {/* Mobile-only expand chevron */}
              {hasExtra && (
                <button
                  type="button"
                  onClick={() => toggleExpand(card.id)}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  className="sm:hidden w-full flex justify-center pb-2 bg-white text-stone-400 active:text-stone-600"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <ChevronDown className="size-3.5" />
                  </motion.div>
                </button>
              )}

              {/* Desktop hover expand */}
              {hasExtra && (
                <div className="hidden sm:block overflow-hidden">
                  <AnimatePresence initial={false}>
                    {isHovered && (
                      <motion.div
                        key="desktop-expand"
                        variants={prefersReducedMotion ? undefined : expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={prefersReducedMotion ? undefined : expandTransition}
                        style={{ overflow: 'hidden' }}
                      >
                        <CardExpandPanel card={card} onSelect={() => toggle(card.id)} isSelected={isSelected} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile tap expand */}
              {hasExtra && (
                <div className="sm:hidden overflow-hidden">
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="mobile-expand"
                        variants={prefersReducedMotion ? undefined : expandVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={prefersReducedMotion ? undefined : expandTransition}
                        style={{ overflow: 'hidden' }}
                      >
                        <CardExpandPanel card={card} onSelect={() => toggle(card.id)} isSelected={isSelected} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!hasExtra && <div className="pb-2 bg-white" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
