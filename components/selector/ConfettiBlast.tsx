'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function ConfettiBlast() {
  useEffect(() => {
    const end = Date.now() + 2500
    const colors = ['#ff6b6b', '#ffa0a0', '#ffce57', '#ff6b6b', '#f9f9f9']

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  return null
}
