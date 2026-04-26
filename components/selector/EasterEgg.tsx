'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function EasterEgg() {
  const [found, setFound] = useState(false)

  return (
    <>
      {/* Hidden monkey — tiny, low opacity, bottom-left corner */}
      <button
        onClick={() => setFound(true)}
        aria-hidden
        className="fixed bottom-3 left-3 z-20 text-[10px] opacity-20 hover:opacity-40 transition-opacity select-none leading-none"
        tabIndex={-1}
      >
        🐒
      </button>

      <AnimatePresence>
        {found && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFound(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl px-8 py-10 text-center max-w-xs shadow-2xl"
            >
              <div className="text-6xl mb-4">🐒🍌</div>
              <p className="font-serif text-xl font-semibold text-stone-900 leading-snug">
                Du hesch de Coco gfunde!
              </p>
              <p className="text-stone-500 text-sm mt-2">
                Hauptpriis: 1000 Küss 🐒🍌♥️
              </p>
              <button
                onClick={() => setFound(false)}
                className="mt-6 text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Schlüsse
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
