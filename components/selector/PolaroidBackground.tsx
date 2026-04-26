'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const PHOTOS = [
  'IMG_0799.JPG',
  'IMG_1024.jpeg',
  'IMG_1473.jpeg',
  'IMG_2187.jpeg',
  'IMG_2465.jpeg',
  'IMG_2649.jpeg',
  'IMG_3478.jpeg',
  'IMG_3883.jpeg',
  'IMG_4061.jpeg',
  'IMG_4088.jpeg',
  'IMG_4732.jpeg',
  'IMG_4994.jpeg',
  'Rapture_20250806_17003.JPG',
]


const PLACEMENTS: {
  top: string
  side: 'left' | 'right'
  offset: string
  rotate: number
}[] = [
  { top: '-3%',  side: 'left',  offset: '10%', rotate: -14 },
  { top: '-3%',  side: 'right', offset: '10%', rotate: 12  },
  { top: '20%',  side: 'left',  offset: '8%',  rotate: 8   },
  { top: '20%',  side: 'right', offset: '8%',  rotate: -10 },
  { top: '44%',  side: 'left',  offset: '9%',  rotate: -6  },
  { top: '44%',  side: 'right', offset: '9%',  rotate: 15  },
  { top: '67%',  side: 'left',  offset: '11%', rotate: 11  },
  { top: '67%',  side: 'right', offset: '11%', rotate: -9  },
  { top: '86%',  side: 'left',  offset: '18%', rotate: -13 },
  { top: '86%',  side: 'right', offset: '18%', rotate: 7   },
]

export function PolaroidBackground() {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectedPhoto = selected !== null ? PHOTOS[selected % PHOTOS.length] : null

  return (
    <>
      <style>{`
        .polaroid {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .polaroid:hover {
          transform: var(--rotate-hover) translateY(-8px) scale(1.04) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10) !important;
          z-index: 20;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {PLACEMENTS.map((p, i) => {
          const src = `/backgrounds/${PHOTOS[i % PHOTOS.length]}`
          const rotate = `rotate(${p.rotate}deg)`
          const rotateHover = `rotate(${p.rotate + (p.rotate > 0 ? 3 : -3)}deg)`
          return (
            <div
              key={i}
              className="polaroid absolute pointer-events-auto"
              onClick={() => setSelected(i)}
              style={{
                top: p.top,
                [p.side]: p.offset,
                width: 220,
                transform: rotate,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['--rotate-hover' as any]: rotateHover,
                boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)',
              }}
            >
              <div style={{ background: 'white', padding: '10px 10px 32px 10px' }}>
                <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#e7e5e4' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Polaroid */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: '16px 16px 16px 16px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                maxWidth: 480,
                width: '100%',
                position: 'relative',
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#e7e5e4' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/backgrounds/${selectedPhoto}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
              >
                <X className="size-4 text-stone-600" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
