'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string // ISO string
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number } | null

function calc(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const target = new Date(targetDate)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc(target))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc(target)), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate])

  if (!timeLeft) {
    return (
      <p className="text-center text-rose-500 font-serif text-lg font-semibold">
        Es isch so wiit! 🎉
      </p>
    )
  }

  const units = [
    { label: 'Tag', value: timeLeft.days },
    { label: 'Std', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sek', value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center justify-center gap-3">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {pad(value)}
          </span>
          <span className="text-xs text-stone-400 uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  )
}
