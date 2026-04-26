'use client'

import { Calendar, Download } from 'lucide-react'

interface CalendarLinksProps {
  title: string
  startIso: string
  location?: string | null
  description?: string | null
}

function toIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function googleCalendarUrl({ title, startIso, location, description }: CalendarLinksProps) {
  const start = toIcsDate(startIso)
  // Default 2-hour duration
  const end = toIcsDate(new Date(new Date(startIso).getTime() + 2 * 3_600_000).toISOString())
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    ...(location ? { location } : {}),
    ...(description ? { details: description } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function generateIcs({ title, startIso, location, description }: CalendarLinksProps) {
  const start = toIcsDate(startIso)
  const end = toIcsDate(new Date(new Date(startIso).getTime() + 2 * 3_600_000).toISOString())
  const uid = `date-night-${Date.now()}@date-selector`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Date Night//Date Night//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return lines
}

export function CalendarLinks(props: CalendarLinksProps) {
  function downloadIcs() {
    const ics = generateIcs(props)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'date-night.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      <a
        href={googleCalendarUrl(props)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-rose-300 hover:text-rose-500 transition-colors"
      >
        <Calendar className="size-4" />
        Google Calendar
      </a>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-rose-300 hover:text-rose-500 transition-colors"
      >
        <Download className="size-4" />
        .ics abelade
      </button>
    </div>
  )
}
