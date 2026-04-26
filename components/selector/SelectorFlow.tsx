'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Heart, Send, Loader2 } from 'lucide-react'
import { DecisionStep } from './DecisionStep'
import { QuizStep } from './QuizStep'
import { ConfettiBlast } from './ConfettiBlast'
import { submitSelection } from '@/lib/actions/submit'

type DecisionModule = {
  type: 'decision'
  id: string
  promptText: string
  allowMultiSelect: boolean
  cards: {
    id: string
    title: string
    description: string | null
    location: string | null
    price_range: string | null
    mood_tags: string[]
    photo_urls: string[]
  }[]
}

type QuizModule = {
  type: 'quiz'
  id: string
  title: string
  questions: { id: string; question_text: string; options: string[] }[]
}

type Module = DecisionModule | QuizModule

interface SelectorFlowProps {
  flowId: string
  introMessage: string | null
  outroMessage: string | null
  modules: Module[]
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function SelectorFlow({ flowId, introMessage, outroMessage, modules }: SelectorFlowProps) {
  // step: -1 = intro, 0..n-1 = module steps, n = message, n+1 = done
  const totalModules = modules.length
  const [step, setStep] = useState(-1)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function go(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  function setAnswer(moduleId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [moduleId]: value }))
  }

  function canProceed(): boolean {
    if (step < 0) return true
    if (step >= totalModules) return true
    const mod = modules[step]
    const answer = answers[mod.id]
    if (mod.type === 'decision') {
      return Array.isArray(answer) && answer.length > 0
    }
    // quiz: all questions must be answered
    const lines = (answer as string | undefined)?.split('\n').filter(Boolean) ?? []
    return lines.length === mod.questions.length
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const submissions = modules.map((mod) => {
        if (mod.type === 'decision') {
          return {
            type: 'decision' as const,
            moduleId: mod.id,
            chosenCardIds: (answers[mod.id] as string[]) ?? [],
          }
        }
        return {
          type: 'quiz' as const,
          moduleId: mod.id,
          chosenOptionText: (answers[mod.id] as string) ?? '',
        }
      })
      await submitSelection(flowId, submissions, message || null)
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ConfettiBlast />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm space-y-4"
        >
          <div className="text-6xl mb-6">💕</div>
          <h1 className="text-2xl font-serif font-semibold text-stone-900">
            {outroMessage || "Can't wait to surprise you!"}
          </h1>
          <p className="text-stone-500 text-sm">Your picks have been sent. Get excited!</p>
        </motion.div>
      </div>
    )
  }

  const isIntro = step === -1
  const isMessageStep = step === totalModules
  const currentModule = !isIntro && !isMessageStep ? modules[step] : null
  const progress = isIntro ? 0 : isMessageStep ? 100 : Math.round(((step + 1) / (totalModules + 1)) * 100)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      {!isIntro && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-stone-100 z-10">
          <motion.div
            className="h-full bg-rose-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center px-5 py-12 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {isIntro && (
            <motion.div
              key="intro"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-8 text-center"
            >
              <Heart className="size-12 fill-rose-400 text-rose-400 mx-auto" />
              <div className="space-y-3">
                <h1 className="text-3xl font-serif font-semibold text-stone-900">
                  Date Night
                </h1>
                <p className="text-stone-500 leading-relaxed max-w-sm mx-auto">
                  {introMessage || "Pick your favourites and I'll make it happen."}
                </p>
              </div>
              <button
                onClick={() => go(0)}
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium px-8 py-3.5 rounded-full transition-colors shadow-lg shadow-rose-200"
              >
                Let's start
                <ArrowRight className="size-4" />
              </button>
            </motion.div>
          )}

          {currentModule && (
            <motion.div
              key={currentModule.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {currentModule.type === 'decision' ? (
                <DecisionStep
                  promptText={currentModule.promptText}
                  allowMultiSelect={currentModule.allowMultiSelect}
                  cards={currentModule.cards}
                  onAnswer={(ids) => setAnswer(currentModule.id, ids)}
                  initialSelection={(answers[currentModule.id] as string[]) ?? []}
                />
              ) : (
                <QuizStep
                  title={currentModule.title}
                  questions={currentModule.questions}
                  onAnswer={(enc) => setAnswer(currentModule.id, enc)}
                  initialAnswers={
                    Object.fromEntries(
                      ((answers[currentModule.id] as string) ?? '')
                        .split('\n')
                        .filter(Boolean)
                        .map((line) => {
                          const idx = line.indexOf(': ')
                          return idx > -1 ? [line.slice(0, idx), line.slice(idx + 2)] : [line, '']
                        }),
                    )
                  }
                />
              )}
            </motion.div>
          )}

          {isMessageStep && (
            <motion.div
              key="message"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-6"
            >
              <div>
                <p className="text-xl font-serif font-semibold text-stone-900">Anything to add?</p>
                <p className="text-sm text-stone-400 mt-1">A note, a wish, or just a kiss 💋 (optional)</p>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I can't wait..."
                rows={4}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 resize-none text-sm"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium px-8 py-3.5 rounded-full transition-colors shadow-lg shadow-rose-200"
              >
                {submitting ? (
                  <><Loader2 className="size-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="size-4" /> Send my picks</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!isIntro && !done && (
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-stone-100 px-5 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={() => go(step - 1)}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors px-3 py-2 rounded-lg hover:bg-stone-50"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <span className="text-xs text-stone-300">
              {isMessageStep ? 'Almost there' : `${step + 1} of ${totalModules}`}
            </span>

            {!isMessageStep && (
              <button
                onClick={() => go(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
              >
                Next
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
