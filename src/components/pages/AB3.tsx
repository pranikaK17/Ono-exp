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
  startTime: string
  endTime: string
}

// 1. Master List of Events
const allEvents: Event[] = [
  /* ── 13 MARCH EVENTS ── */
  {
    title: "Destival Prelims – Coreo",
    date: "13 March, 2026", time: "9 am - 10 am", venue: "AB3 010, 011, 012",
    description: "Coreo's flagship festival kicks off with electrifying dance prelims. Watch teams compete to secure their spot in the final showdown.",
    image: "",
    startTime: "2026-03-13T09:00:00", endTime: "2026-03-13T10:00:00",
  },
  {
    title: "Cosmos & Requiem Prelims – TMC & D Club",
    date: "13 March, 2026", time: "10 am - 11 am", venue: "AB3 010, 011, 012",
    description: "A dramatic collision of theatre and creative expression. TMC and D Club bring their visionary prelims to the stage — expect the unexpected.",
    image: "",
    startTime: "2026-03-13T10:00:00", endTime: "2026-03-13T11:00:00",
  },
  {
    title: "Nextar – Coreo",
    date: "13 March, 2026", time: "11 am - 12:30 pm", venue: "AB3 010, 011, 012",
    description: "Coreo's next-gen talent showcase. A high-energy platform for emerging dancers and choreographers to push boundaries and own the floor.",
    image: "",
    startTime: "2026-03-13T11:00:00", endTime: "2026-03-13T12:30:00",
  },
  {
    title: "Stage Play – Cine",
    date: "13 March, 2026", time: "12:30 pm - 2 pm", venue: "AB3 008",
    description: "Cinephilia brings a captivating live stage play to Oneiros. Witness raw emotion, compelling scripts, and powerful performances unfold in real time.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T14:00:00",
  },
  {
    title: "BEHAS – Litmus",
    date: "13 March, 2026", time: "2 pm - 3 pm", venue: "AB3 008, 009, 013, 015, 016, 017, 018, 019",
    description: "Litmus hosts BEHAS, a battle of ideas and intellect. Participants debate, deliberate, and defend their standpoints across multiple arenas.",
    image: "",
    startTime: "2026-03-13T14:00:00", endTime: "2026-03-13T15:00:00",
  },
  {
    title: "BEHAS – Litmus",
    date: "13 March, 2026", time: "3 pm - 4 pm", venue: "AB3 110–118",
    description: "The debate continues — round 2 of BEHAS scales up to the upper floors. Arguments sharpen, stakes rise, and only the strongest voices prevail.",
    image: "",
    startTime: "2026-03-13T15:00:00", endTime: "2026-03-13T16:00:00",
  },
  {
    title: "BEHAS – Litmus",
    date: "13 March, 2026", time: "4 pm - 5 pm", venue: "AB3 110–118",
    description: "BEHAS enters its semifinal phase. The competition narrows as debaters face their toughest challengers yet in a battle of wit and rhetoric.",
    image: "",
    startTime: "2026-03-13T16:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "BEHAS – Litmus",
    date: "13 March, 2026", time: "5 pm - 6 pm", venue: "AB3 110–118",
    description: "The final hour of Day 1 BEHAS. Only the sharpest minds remain — watch the best debaters of the event clash in one last intense session.",
    image: "",
    startTime: "2026-03-13T17:00:00", endTime: "2026-03-13T18:00:00",
  },

  /* ── 14 MARCH EVENTS ── */
  {
    title: "Octaves – TMC",
    date: "14 March, 2026", time: "9 am - 10 am", venue: "Sharada Pai",
    description: "TMC opens Day 2 with Octaves, a musical showcase that spans genres and generations. Voices intertwine in harmony at the Sharada Pai auditorium.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T10:00:00",
  },
  {
    title: "Blueprints of Justice – Human Rights Cell",
    date: "14 March, 2026", time: "10 am - 11 am", venue: "Sharada Pai",
    description: "The Human Rights Cell presents a thought-provoking session on justice, law, and equity. Engage with ideas that challenge and inspire.",
    image: "",
    startTime: "2026-03-14T10:00:00", endTime: "2026-03-14T11:00:00",
  },
  {
    title: "Dhwani – TMC",
    date: "14 March, 2026", time: "11 am - 12 pm", venue: "Sharada Pai",
    description: "Dhwani — where music meets soul. TMC's signature melodic competition fills the Sharada Pai auditorium with voices competing for glory.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T12:00:00",
  },
  {
    title: "Follow Your Dreams 3.0 – 180 DC",
    date: "14 March, 2026", time: "12 pm - 2 pm", venue: "TMA Pai",
    description: "180 DC's inspiring flagship event returns for its third edition. Hear from changemakers, entrepreneurs, and visionaries chasing their boldest dreams.",
    image: "",
    startTime: "2026-03-14T12:00:00", endTime: "2026-03-14T14:00:00",
  },
  {
    title: "BEHAS Closing – Litmus",
    date: "14 March, 2026", time: "2 pm - 3 pm", venue: "AB3 Hall",
    description: "The grand finale of BEHAS. After two days of fierce debate, the last voices standing face off in an electrifying closing ceremony at AB3 Hall.",
    image: "",
    startTime: "2026-03-14T14:00:00", endTime: "2026-03-14T15:00:00",
  },
  {
    title: "Follow Your Dreams 3.0 – 180 DC",
    date: "14 March, 2026", time: "3 pm - 4 pm", venue: "TMA Pai",
    description: "The afternoon session of Follow Your Dreams continues with interactive discussions, mentorship circles, and breakthrough stories from real achievers.",
    image: "",
    startTime: "2026-03-14T15:00:00", endTime: "2026-03-14T16:00:00",
  },
  {
    title: "Follow Your Dreams 3.0 – 180 DC",
    date: "14 March, 2026", time: "4 pm - 5 pm", venue: "TMA Pai",
    description: "The final hour of Follow Your Dreams 3.0. Wrap up with key takeaways, closing reflections, and a celebration of ambition and purpose.",
    image: "",
    startTime: "2026-03-14T16:00:00", endTime: "2026-03-14T17:00:00",
  },

  /* ── 15 MARCH EVENTS ── */
  {
    title: "Sanskriti – SPICMACAY",
    date: "15 March, 2026", time: "9 am - 10 am", venue: "Vasanti Pai",
    description: "SPICMACAY celebrates India's rich classical heritage with Sanskriti — an immersive cultural morning featuring music, dance, and tradition.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T10:00:00",
  },
  {
    title: "Fanbase Face-Off – Qureka & Marksoc",
    date: "15 March, 2026", time: "10 am - 11 am", venue: "Vasanti Pai",
    description: "Which fanbase reigns supreme? Qureka and Marksoc pit pop culture communities against each other in this ultimate fan trivia showdown.",
    image: "",
    startTime: "2026-03-15T10:00:00", endTime: "2026-03-15T11:00:00",
  },
  {
    title: "Destival Prelims",
    date: "15 March, 2026", time: "11 am - 12 pm", venue: "Ramdas Pai",
    description: "Day 3 brings the next round of Destival prelims to the Ramdas Pai stage. The competition intensifies as finalists fight for their last chance to advance.",
    image: "",
    startTime: "2026-03-15T11:00:00", endTime: "2026-03-15T12:00:00",
  },
  {
    title: "Requiem & Cosmos Prelims",
    date: "15 March, 2026", time: "12 pm - 1:30 pm", venue: "Ramdas Pai",
    description: "The final round of Requiem and Cosmos prelims. Dark narratives meet cosmic imagination as the best acts from both clubs battle for finals.",
    image: "",
    startTime: "2026-03-15T12:00:00", endTime: "2026-03-15T13:30:00",
  },
  {
    title: "Stage Play – Cine",
    date: "15 March, 2026", time: "1:30 pm - 3 pm", venue: "AB3 008",
    description: "Cinephilia returns with a second stage play performance on the closing day of Oneiros. A fitting dramatic send-off to the festival season.",
    image: "",
    startTime: "2026-03-15T13:30:00", endTime: "2026-03-15T15:00:00",
  },
  {
    title: "Nextar – Coreo",
    date: "15 March, 2026", time: "3 pm - 5 pm", venue: "AB3 010–012",
    description: "Coreo closes Oneiros in style with the final edition of Nextar. Expect high-voltage performances, stunning choreography, and an unforgettable finale.",
    image: "",
    startTime: "2026-03-15T15:00:00", endTime: "2026-03-15T17:00:00",
  },
]

// 2. Fallback for when there are no live events
const noLiveEventFallback: Event = {
  title: 'No Live Events Currently',
  date: 'Check back later',
  time: '—',
  venue: 'AB3',
  description: 'There are no events happening right now in AB3. Browse the upcoming tab to see what\'s next!',
  image: '',
  startTime: '',
  endTime: '',
}

type Tab = 'past' | 'live' | 'upcoming'

/* ── Featured card ───────────────────────────────────────────────────────── */
function FeaturedEventCard({ event, badge }: { event: Event; badge?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,180,50,0.25)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
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
              background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(220,150,30,0.75)',
              color: '#fff', fontSize: '0.65rem', fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              padding: '4px 14px', borderRadius: 6,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              animation: badge === '● LIVE' ? 'pulse-live 2s ease-in-out infinite' : undefined,
            }}>{badge}</div>
          )}
        </div>
      ) : (
        <div style={{
          height: 6,
          background: badge === '● LIVE'
            ? 'linear-gradient(90deg, #ff3232, #ff6b6b)'
            : 'linear-gradient(90deg, rgba(220,150,30,0.8), rgba(255,210,80,0.6))',
        }} />
      )}

      <div style={{
        padding: '28px 50px', background: 'rgba(0,0,0,0.3)',
        borderTop: event.image ? '1px solid rgba(255,180,50,0.12)' : 'none',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {!event.image && badge && (
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start',
            background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(255,180,50,0.2)',
            border: `1px solid ${badge === '● LIVE' ? 'rgba(255,80,80,0.6)' : 'rgba(255,180,50,0.5)'}`,
            color: badge === '● LIVE' ? '#ff6b6b' : '#ffb832',
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
          fontFamily: "'Orbitron', sans-serif", color: '#fff8e8',
        }}>{event.title}</h2>
        <div style={{
          display: 'flex', gap: 20, marginTop: 10,
          fontSize: '0.75rem', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ color: 'rgba(255,180,50,0.9)' }}>{event.date}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: event.time === 'LIVE NOW' ? '#ff6b6b' : '#ffb832', fontWeight: 600 }}>{event.time}</span>
        </div>
        <div style={{
          marginTop: 6, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)',
          fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.04em',
        }}>{event.venue}</div>
        <p style={{
          margin: '14px 0 0', fontSize: '0.85rem', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.5)', fontFamily: "'Manrope', sans-serif",
        }}>{event.description}</p>
        {event.link && (
          <div style={{
            marginTop: 18, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 12,
          }}>
            <a href={event.link} style={{
              padding: '8px 22px', borderRadius: 8,
              background: 'rgba(255,180,50,0.12)', border: '1px solid rgba(255,180,50,0.4)',
              color: '#ffb832', fontSize: '0.72rem', fontWeight: 600,
              fontFamily: "'Orbitron', sans-serif", textDecoration: 'none',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Details</a>
          </div>
        )}
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
        border: '1px solid rgba(255,180,50,0.15)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.3s, transform 0.3s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,180,50,0.45)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,180,50,0.15)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {event.image && (
        <div style={{ height: 80, background: `url(${event.image}) center/cover` }} />
      )}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{
          margin: 0, fontSize: '0.78rem', fontWeight: 600,
          fontFamily: "'Orbitron', sans-serif", color: '#fff0cc', lineHeight: 1.3,
        }}>{event.title}</h4>
        <div style={{
          marginTop: 5, fontSize: '0.62rem',
          color: 'rgba(255,180,50,0.75)', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>{event.date}</div>
        <div style={{
          marginTop: 2, fontSize: '0.65rem', fontWeight: 600,
          color: '#ffb832', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.04em',
        }}>{event.time}</div>
      </div>
    </div>
  )
}

/* ── Tab button style ────────────────────────────────────────────────────── */
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px', borderRadius: 8,
  border: active ? '1px solid rgba(255,180,50,0.6)' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(255,180,50,0.12)' : 'rgba(255,255,255,0.04)',
  color: active ? '#ffb832' : 'rgba(255,255,255,0.45)',
  fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(6px)',
})

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AB3({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('live')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

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

  const rightTitle = tab === 'upcoming' ? 'All Events' : 'Upcoming'
  const rightEvents = tab === 'upcoming'
    ? upcomingEvents.filter((_, i) => i !== selectedIdx)
    : upcomingEvents
  const rightColor = '#ffb832'

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
                <div style={{ position: 'relative' }}>
                  {showNav && (
                    <button
                      onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                      disabled={selectedIdx === 0}
                      style={{
                        position: 'absolute', top: '50%', left: 10,
                        transform: 'translateY(-50%)', zIndex: 10,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(255,180,50,0.18)',
                        border: '1px solid rgba(255,180,50,0.45)',
                        color: '#ffb832', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        opacity: selectedIdx === 0 ? 0.2 : 1,
                        cursor: selectedIdx === 0 ? 'default' : 'pointer',
                      }}
                    >‹</button>
                  )}

                  <div
                    key={tab + selectedIdx}
                    style={{ animation: 'ab3-center-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
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
                        background: 'rgba(255,180,50,0.18)',
                        border: '1px solid rgba(255,180,50,0.45)',
                        color: '#ffb832', fontSize: '1rem',
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
                          background: i === selectedIdx ? '#ffb832' : 'rgba(255,255,255,0.18)',
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

          {/* Other upcoming events list */}
          {rightEvents.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <h3 style={{
                margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 500,
                fontFamily: "'Orbitron', sans-serif", color: rightColor,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>{rightTitle}</h3>
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

          {/* Past / live sibling events */}
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
        @keyframes ab3-center-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) {
          .ab3-grid { grid-template-columns: 1fr !important; overflow-y: auto; flex: unset !important; min-height: unset !important; }
          .ab3-grid > div { min-height: unset !important; }
        }
      `}</style>
    </div>
  )
}