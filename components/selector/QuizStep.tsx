'use client'

import { useState } from 'react'

type Question = {
  id: string
  question_text: string
  options: string[]
}

interface QuizStepProps {
  title: string
  questions: Question[]
  onAnswer: (encoded: string) => void
  initialAnswers?: Record<string, string>
}

export function QuizStep({ title, questions, onAnswer, initialAnswers = {} }: QuizStepProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)

  function pick(questionText: string, option: string) {
    const next = { ...answers, [questionText]: option }
    setAnswers(next)
    const encoded = questions
      .filter((q) => next[q.question_text])
      .map((q) => `${q.question_text}: ${next[q.question_text]}`)
      .join('\n')
    onAnswer(encoded)
  }

  return (
    <div className="space-y-6">
      <p className="text-xl font-serif font-semibold text-stone-900">{title}</p>

      <div className="space-y-5">
        {questions.map((q) => (
          <div key={q.id} className="space-y-3">
            <p className="text-sm font-medium text-stone-700">{q.question_text}</p>
            <div className="grid gap-2">
              {q.options.map((opt) => {
                const isSelected = answers[q.question_text] === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(q.question_text, opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
