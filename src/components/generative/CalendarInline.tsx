// components/generative/CalendarInline.tsx
// Renders upcoming events inline in the chat thread
'use client'

import { z } from 'zod'
import type { TamboComponent } from '@tambo-ai/react'
import { useEffect, useState } from 'react'
import { Calendar, Clock, CheckCircle2, ExternalLink, Globe, GitBranch, Image, ArrowRight } from 'lucide-react'

// ─── Schema ───
export const CalendarInlinePropsSchema = z.object({
  maxItems: z.number().nullable().default(5).describe("Max events to show (default 5)"),
  showCompleted: z.boolean().nullable().default(false).describe("Whether to include completed events"),
  filterTitle: z.string().nullable().default('').describe("Optional title filter substring"),
})

// Tambo streaming safety
const _parse = CalendarInlinePropsSchema.parse.bind(CalendarInlinePropsSchema)
const _safeParse = CalendarInlinePropsSchema.safeParse.bind(CalendarInlinePropsSchema)
;(CalendarInlinePropsSchema as any).parse = (d: unknown, p?: any) => _parse(d ?? {}, p)
;(CalendarInlinePropsSchema as any).safeParse = (d: unknown, p?: any) => _safeParse(d ?? {}, p)

type Props = z.infer<typeof CalendarInlinePropsSchema>

interface CalEvent {
  id: string
  title: string
  datetime: string
  note?: string
  completed?: boolean
  linkedItems?: any[]
  linkedCollection?: string
}

function CalendarInline({ maxItems, showCompleted, filterTitle }: Props) {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (e) {
      console.error('CalendarInline fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort
  let filtered = [...events]
  if (!showCompleted) filtered = filtered.filter(e => !e.completed)
  if (filterTitle) {
    const q = (filterTitle || '').toLowerCase()
    filtered = filtered.filter(e => (e.title || '').toLowerCase().includes(q))
  }
  filtered.sort((a, b) => new Date(a.datetime || 0).getTime() - new Date(b.datetime || 0).getTime())
  const display = filtered.slice(0, maxItems || 5)
  const remaining = filtered.length - display.length

  // Loading
  if (loading) {
    return (
      <div className="rounded-2xl p-6 fs-animate-in" style={{ background: 'var(--fs-cream-100)', border: '1px solid var(--fs-cream-300)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--fs-sage-100)' }}>
            <Calendar size={16} style={{ color: 'var(--fs-sage-600)' }} />
          </div>
          <div className="h-4 w-32 rounded-lg animate-pulse" style={{ background: 'var(--fs-cream-300)' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl mt-3 animate-pulse" style={{ background: 'var(--fs-cream-200)' }} />
        ))}
      </div>
    )
  }

  // Empty
  if (display.length === 0) {
    return (
      <div className="rounded-2xl p-6 fs-animate-in" style={{ background: 'var(--fs-cream-100)', border: '1px solid var(--fs-cream-300)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--fs-sage-100)' }}>
            <Calendar size={16} style={{ color: 'var(--fs-sage-600)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--fs-text-primary)' }}>Calendar</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--fs-text-muted)' }}>
          No upcoming events. Try scheduling something!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden fs-animate-in"
      style={{ background: 'var(--fs-cream-100)', border: '1px solid var(--fs-cream-300)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--fs-sage-100)' }}>
            <Calendar size={16} strokeWidth={1.8} style={{ color: 'var(--fs-sage-600)' }} />
          </div>
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--fs-text-primary)' }}>
              Upcoming Schedule
            </span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: 'var(--fs-sage-100)', color: 'var(--fs-sage-700)' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="px-4 pb-4 space-y-2 mt-1">
        {display.map((event, idx) => {
          const date = new Date(event.datetime || 0)
          const isToday = date.toDateString() === new Date().toDateString()
          const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString()
          const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

          return (
            <div key={event.id || idx} className="rounded-xl p-3.5 transition-all"
              style={{
                background: 'white',
                border: '1px solid var(--fs-cream-200)',
                animationDelay: `${idx * 60}ms`,
              }}>
              <div className="flex items-start gap-3">
                {/* Date pill */}
                <div className="flex flex-col items-center shrink-0 min-w-11 pt-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wide"
                    style={{ color: isToday ? 'var(--fs-sage-600)' : 'var(--fs-text-muted)' }}>
                    {date.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold leading-tight"
                    style={{ color: isToday ? 'var(--fs-sage-700)' : 'var(--fs-text-primary)' }}>
                    {date.getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--fs-text-primary)' }}>
                    {event.completed && <CheckCircle2 size={13} className="inline mr-1.5 -mt-0.5" style={{ color: 'var(--fs-sage-500)' }} />}
                    {event.title}
                  </p>

                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--fs-text-muted)' }}>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} strokeWidth={2} />
                      {dayLabel}, {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {event.note && (
                    <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'var(--fs-text-secondary)' }}>
                      {event.note}
                    </p>
                  )}

                  {/* Linked items */}
                  {event.linkedItems && event.linkedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {event.linkedItems.slice(0, 3).map((item: any, i: number) => {
                        if (typeof item === 'object' && item?.url) {
                          const TypeIcon = item.type === 'repo' ? GitBranch : item.type === 'image' ? Image : Globe
                          return (
                            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors"
                              style={{ background: 'var(--fs-sage-50)', color: 'var(--fs-sage-700)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--fs-sage-100)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--fs-sage-50)' }}>
                              <TypeIcon size={11} strokeWidth={2} />
                              <span className="truncate max-w-[140px]">{item.title || 'Link'}</span>
                              <ExternalLink size={9} strokeWidth={2} className="opacity-50" />
                            </a>
                          )
                        }
                        return null
                      })}
                      {event.linkedItems.length > 3 && (
                        <span className="text-[11px] px-2 py-1 rounded-lg" style={{ background: 'var(--fs-cream-200)', color: 'var(--fs-text-muted)' }}>
                          +{event.linkedItems.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {remaining > 0 && (
        <div className="px-5 pb-4">
          <div className="text-xs flex items-center gap-1.5 font-medium"
            style={{ color: 'var(--fs-sage-600)' }}>
            <ArrowRight size={12} strokeWidth={2} />
            {remaining} more event{remaining !== 1 ? 's' : ''} — switch to Calendar tab to see all
          </div>
        </div>
      )}
    </div>
  )
}

export const calendarInlineComponent: TamboComponent = {
  name: 'CalendarInline',
  description: `Show the user's upcoming scheduled events inline in chat. Use when user asks:
- "What's my schedule?"
- "Show my upcoming events"
- "Do I have anything scheduled?"
- "What's coming up?"
- After creating a calendar event (to confirm it was saved)
Renders a compact card with event dates, times, notes, and clickable linked items.`,
  component: CalendarInline,
  propsSchema: CalendarInlinePropsSchema,
}