import React, { useState, useEffect } from 'react'
import '../../App.css'

interface Event {
  title: string
  date: string
  time: string
  venue: string
  description: string
  image: string
  link?: string
  // ISO format strings for automatic time sorting
  startTime: string
  endTime: string
}

// 1. Master List of Events
const allEvents: Event[] = [
  /* ── 13 MARCH EVENTS ── */
  {
    title: "SkyRise / IEEE Student Chapter",
    date: "13 March, 2026",
    time: "3 pm - 5 pm",
    venue: "Grand Staircase (LAWN)",
    description: "", image: "",
    startTime: "2026-03-13T15:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Bachpan / Managia",
    date: "13 March, 2026",
    time: "12:30 pm - 5 pm",
    venue: "Grand Staircase Terrace",
    description: "Bachpan —a dedicated space to celebrate the innocence, the games, and the pure, unadulterated joy of our childhood", image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },

  /* ── 14 MARCH EVENTS ── */
  {
    title: "Rajputana Royals / CACTUS",
    date: "14 March, 2026",
    time: "9 am - 5 pm",
    venue: "Grand Staircase Terrace",
    description: "", image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },

  /* ── 15 MARCH EVENTS ── */
  {
    title: "Nukkad Nattak / Pratishodh",
    date: "15 March, 2026",
    time: "9 am - 5 pm",
    venue: "Grand Staircase (LAWN)",
    description: "Street Play Showdown ", image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  }
]

// 2. Fallback for when there are no live events
const noLiveEventFallback: Event = {
  title: 'No Live Events Currently',
  date: 'Check back later',
  time: '—',
  venue: 'Campus Wide',
  description: 'There are no events happening right now. Browse our upcoming tabs to see what to look forward to!',
  image: '',
  startTime: '',
  endTime: '',
}

type Tab = 'past' | 'live' | 'upcoming'

/* ── Featured card (shown in center) ─────────────────────────────────────── */
function FeaturedEventCard({ event, badge }: { event: Event; badge?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(168,85,247,0.25)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Only render image area when an actual image exists */}
      {event.image ? (
        <div style={{
          flex: 1, minHeight: 220,
          background: `url(${event.image}) center/cover`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
          position: 'relative',
        }}>
          {badge && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(168,85,247,0.7)',
              color: '#fff', fontSize: '0.65rem', fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              padding: '4px 14px', borderRadius: 6,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              animation: badge === '● LIVE' ? 'pulse-live 2s ease-in-out infinite' : undefined,
            }}>{badge}</div>
          )}
        </div>
      ) : (
        /* No image: just a thin decorative top accent bar */
        <div style={{
          height: 6,
          background: badge === '● LIVE'
            ? 'linear-gradient(90deg, #ff3232, #ff6b6b)'
            : 'linear-gradient(90deg, rgba(168,85,247,0.8), rgba(236,72,153,0.6))',
        }} />
      )}

      <div style={{
        padding: '28px 50px', background: 'rgba(0,0,0,0.3)',
        borderTop: event.image ? '1px solid rgba(168,85,247,0.12)' : 'none',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {/* Badge inline when there's no image */}
        {!event.image && badge && (
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start',
            background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(168,85,247,0.2)',
            border: `1px solid ${badge === '● LIVE' ? 'rgba(255,80,80,0.6)' : 'rgba(168,85,247,0.5)'}`,
            color: badge === '● LIVE' ? '#ff6b6b' : '#c084fc',
            fontSize: '0.65rem', fontWeight: 700,
            fontFamily: "'Orbitron', sans-serif",
            padding: '4px 14px', borderRadius: 6,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16,
            animation: badge === '● LIVE' ? 'pulse-live 2s ease-in-out infinite' : undefined,
          }}>{badge}</div>
        )}

        <h2 style={{
          margin: 0, fontSize: '1.35rem', fontWeight: 700,
          fontFamily: "'Orbitron', sans-serif", color: '#f5f0ff',
        }}>{event.title}</h2>
        <div style={{
          display: 'flex', gap: 20, marginTop: 10,
          fontSize: '0.75rem', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ color: 'rgba(168,85,247,0.9)' }}>{event.date}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: event.time === 'LIVE NOW' ? '#ff6b6b' : '#a855f7', fontWeight: 600 }}>{event.time}</span>
        </div>
        <div style={{
          marginTop: 6, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)',
          fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.04em',
        }}>{event.venue}</div>
        <p style={{
          margin: '14px 0 0', fontSize: '0.85rem', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.5)', fontFamily: "'Manrope', sans-serif",
        }}>{event.description}</p>

      </div>
    </div>
  )
}

/* ── Small side card ─────────────────────────────────────────────────────── */
function SideCard({ event, onClick }: { event: Event; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.3s, transform 0.3s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Only render image/thumbnail area when there's an actual image */}
      {event.image && (
        <div style={{
          height: 80,
          background: `url(${event.image}) center/cover`,
        }} />
      )}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{
          margin: 0, fontSize: '0.78rem', fontWeight: 600,
          fontFamily: "'Orbitron', sans-serif", color: '#e8d8ff', lineHeight: 1.3,
        }}>{event.title}</h4>
        <div style={{
          marginTop: 5, fontSize: '0.62rem',
          color: 'rgba(168,85,247,0.75)', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {event.date}
        </div>
        <div style={{
          marginTop: 2, fontSize: '0.65rem', fontWeight: 600,
          color: '#a855f7', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.04em',
        }}>
          {event.time}
        </div>
      </div>
    </div>
  )
}

/* ── Tab button style ────────────────────────────────────────────────────── */
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px', borderRadius: 8,
  border: active ? '1px solid rgba(168,85,247,0.6)' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
  color: active ? '#c084fc' : 'rgba(255,255,255,0.45)',
  fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(6px)',
})

/* ── Main component ──────────────────────────────────────────────────────── */
export default function GrandStairs({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('live')
  const [selectedIdx, setSelectedIdx] = useState(0)

  // State to track current time
  const [now, setNow] = useState(new Date())

  // Update current time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Filter events based on time
  const pastEvents = allEvents.filter(e => new Date(e.endTime) < now)
  const upcomingEvents = allEvents.filter(e => new Date(e.startTime) > now)
  const liveEvents = allEvents.filter(
    e => new Date(e.startTime) <= now && new Date(e.endTime) >= now
  )

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const centerEvent =
    tab === 'live'
      ? (liveEvents.length > 0 ? liveEvents[0] : noLiveEventFallback)
      : tab === 'upcoming'
        ? (upcomingEvents[selectedIdx] || upcomingEvents[0])
        : (pastEvents[selectedIdx] || pastEvents[0])

  const centerBadge = tab === 'live' && liveEvents.length > 0 ? '● LIVE'
    : tab === 'live' ? 'OFFLINE'
      : tab === 'upcoming' ? 'UPCOMING'
        : 'PAST'

  const leftTitle = tab === 'past' ? 'Happening Now' : 'Past Events'
  const leftEvents = tab === 'past' ? liveEvents : pastEvents
  const leftColor = tab === 'past' ? '#ff6b6b' : 'rgba(255,255,255,0.3)'

  // For upcoming tab: list shows all other upcoming events
  const rightTitle = tab === 'upcoming' ? 'All Events' : tab === 'live' ? 'Upcoming' : 'Upcoming'
  const rightEvents = tab === 'upcoming'
    ? upcomingEvents.filter((_, i) => i !== selectedIdx)
    : upcomingEvents
  const rightColor = '#a855f7'


  return (
    <div
      className="page-overlay"
      onMouseDown={stop} onMouseMove={stop} onMouseUp={stop}
      onWheel={stop} onPointerDown={stop} onPointerMove={stop} onPointerUp={stop}
      onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop}
      onContextMenu={stop} onDoubleClick={stop}
    >
      <button className="page-overlay-close" onClick={onClose}>✕</button>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '40px 24px 60px',
        height: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* ── Top tabs ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 14,
          marginBottom: 32, flexShrink: 0,
        }}>
          <button style={tabStyle(tab === 'past')} onClick={() => { setTab('past'); setSelectedIdx(0) }}>
            Past Events
          </button>
          <button style={tabStyle(tab === 'live')} onClick={() => { setTab('live'); setSelectedIdx(0) }}>
            Happening Now
          </button>
          <button style={tabStyle(tab === 'upcoming')} onClick={() => { setTab('upcoming'); setSelectedIdx(0) }}>
            Upcoming
          </button>
        </div>

        {/* ── Vertical layout ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>

          {/* Featured Event + navigation */}
          {(() => {
            const navList = tab === 'upcoming' ? upcomingEvents : tab === 'past' ? pastEvents : []
            const showNav = tab !== 'live' && navList.length > 1
            return (
              <div style={{ flexShrink: 0 }}>
                {/* Card with side arrows */}
                <div style={{ position: 'relative' }}>
                  {showNav && (
                    <button
                      onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                      disabled={selectedIdx === 0}
                      style={{
                        position: 'absolute', top: '50%', left: 10,
                        transform: 'translateY(-50%)', zIndex: 10,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(168,85,247,0.18)',
                        border: '1px solid rgba(168,85,247,0.45)',
                        color: '#a855f7', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        opacity: selectedIdx === 0 ? 0.2 : 1,
                        cursor: selectedIdx === 0 ? 'default' : 'pointer',
                      }}
                    >‹</button>
                  )}

                  <div
                    key={tab + selectedIdx}
                    style={{ animation: 'gs-center-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  >
                    {centerEvent ? (
                      <FeaturedEventCard event={centerEvent} badge={centerBadge} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontFamily: "'Orbitron', sans-serif" }}>
                        No events found.
                      </div>
                    )}
                  </div>

                  {showNav && (
                    <button
                      onClick={() => setSelectedIdx(i => Math.min(navList.length - 1, i + 1))}
                      disabled={selectedIdx === navList.length - 1}
                      style={{
                        position: 'absolute', top: '50%', right: 10,
                        transform: 'translateY(-50%)', zIndex: 10,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(168,85,247,0.18)',
                        border: '1px solid rgba(168,85,247,0.45)',
                        color: '#a855f7', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        opacity: selectedIdx === navList.length - 1 ? 0.2 : 1,
                        cursor: selectedIdx === navList.length - 1 ? 'default' : 'pointer',
                      }}
                    >›</button>
                  )}
                </div>

                {/* Dot indicators */}
                {showNav && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                    {navList.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          width: 7, height: 7, borderRadius: '50%', border: 'none', padding: 0,
                          background: i === selectedIdx ? '#a855f7' : 'rgba(255,255,255,0.18)',
                          cursor: 'pointer', transition: 'background 0.2s, transform 0.2s',
                          transform: i === selectedIdx ? 'scale(1.5)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Event list — past / upcoming / live siblings */}
          {(leftEvents.length > 0 || rightEvents.length > 0) && (
            <div style={{ flexShrink: 0 }}>
              {/* Section header */}
              {rightEvents.length > 0 && (
                <h3 style={{
                  margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 500,
                  fontFamily: "'Orbitron', sans-serif", color: rightColor,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>{rightTitle}</h3>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rightEvents.map((ev, i) => (
                  <SideCard
                    key={i}
                    event={ev}
                    onClick={() => {
                      const realIdx = upcomingEvents.indexOf(ev)
                      if (realIdx !== -1) setSelectedIdx(realIdx)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Left side events (past / live when on past tab) */}
          {leftEvents.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <h3 style={{
                margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 500,
                fontFamily: "'Orbitron', sans-serif", color: leftColor,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>{leftTitle}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leftEvents.map((ev, i) => (
                  <SideCard
                    key={i}
                    event={ev}
                    onClick={() => {
                      const realIdx = pastEvents.indexOf(ev)
                      if (realIdx !== -1) setSelectedIdx(realIdx)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes gs-center-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Mobile: stack columns top-to-bottom ── */
        @media (max-width: 768px) {
          .gs-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto;
            flex: unset !important;
            min-height: unset !important;
          }

          .gs-grid > div {
            min-height: unset !important;
          }
        }
      `}</style>
    </div>
  )
}