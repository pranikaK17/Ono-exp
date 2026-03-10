import { useState } from 'react'
import '../../App.css'

interface Event {
  title: string
  date: string
  time: string
  venue: string
  description: string
  image: string
  link?: string
}

const liveEvent: Event = {
  title: 'Street Food Fest — Live Cook-Off',
  date: 'Mar 9, 2026',
  time: 'LIVE NOW',
  venue: 'Old Mess — Open Courtyard',
  description: 'Campus chefs and food societies battle it out in a live cook-off. Taste, vote, and crown the best dish.',
  image: '',
  link: '#',
}

const upcomingEvents: Event[] = [
  {
    title: 'Midnight Chai Sessions',
    date: 'Mar 14, 2026',
    time: '11:00 PM',
    venue: 'Old Mess — Main Dining Hall',
    description: 'Late-night chai, snacks, and unfiltered conversations. Show up, sit down, talk to a stranger.',
    image: '',
  },
  {
    title: 'Regional Thali Showcase',
    date: 'Mar 17, 2026',
    time: '1:00 PM',
    venue: 'Old Mess — Banquet Wing',
    description: 'Student groups serve up authentic regional thalis from across the country. One day, every flavour.',
    image: '',
  },
  {
    title: 'Farm to Table Brunch',
    date: 'Mar 21, 2026',
    time: '10:00 AM',
    venue: 'Old Mess — Garden Terrace',
    description: 'A slow Sunday brunch made entirely from campus-grown produce. Local, fresh, and unrushed.',
    image: '',
  },
]

const pastEvents: Event[] = [
  {
    title: 'Bonfire & BBQ Night',
    date: 'Feb 21, 2026',
    time: '7:00 PM',
    venue: 'Old Mess — Back Lawn',
    description: 'Smoke, sizzle, and stories around the fire. The most attended night of the semester so far.',
    image: '',
  },
  {
    title: 'Blind Taste Challenge',
    date: 'Feb 14, 2026',
    time: '4:00 PM',
    venue: 'Old Mess — Dining Hall B',
    description: 'Participants guessed mystery dishes blindfolded. Chaos, laughter, and one very wrong answer.',
    image: '',
  },
  {
    title: 'Heritage Recipe Contest',
    date: 'Feb 7, 2026',
    time: '12:00 PM',
    venue: 'Old Mess — Kitchen Lab',
    description: `Students cooked their family's signature dish and shared the story behind it.`,
    image: '',
  },
]

type Tab = 'past' | 'live' | 'upcoming'

/* ── Featured card ───────────────────────────────────────────────────────── */
function FeaturedEventCard({ event, badge }: { event: Event; badge?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(52,211,153,0.25)',
      borderRadius: 16,
      overflow: 'hidden',
      height: '100%',
    }}>
      <div style={{
        flex: 1, minHeight: 220,
        background: event.image
          ? `url(${event.image}) center/cover`
          : 'linear-gradient(135deg, rgba(16,120,70,0.12), rgba(52,211,153,0.07))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {!event.image && <span style={{ fontSize: 72, color: 'rgba(255,255,255,0.06)' }}>◈</span>}
        {badge && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(30,160,100,0.8)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
            fontFamily: "'Orbitron', sans-serif",
            padding: '4px 14px', borderRadius: 6,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            animation: badge === '● LIVE' ? 'pulse-live 2s ease-in-out infinite' : undefined,
          }}>{badge}</div>
        )}
      </div>
      <div style={{
        padding: '24px 28px', background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(52,211,153,0.1)',
      }}>
        <h2 style={{
          margin: 0, fontSize: '1.35rem', fontWeight: 700,
          fontFamily: "'Orbitron', sans-serif", color: '#e8fff4',
        }}>{event.title}</h2>
        <div style={{
          display: 'flex', gap: 20, marginTop: 10,
          fontSize: '0.75rem', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ color: 'rgba(52,211,153,0.9)' }}>{event.date}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: event.time === 'LIVE NOW' ? '#ff6b6b' : '#34d399', fontWeight: 600 }}>{event.time}</span>
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
            <a href="#" style={{
              padding: '8px 22px', borderRadius: 8,
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)',
              color: '#34d399', fontSize: '0.72rem', fontWeight: 600,
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
        border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.3s, transform 0.3s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(52,211,153,0.15)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        height: 80,
        background: event.image
          ? `url(${event.image}) center/cover`
          : 'linear-gradient(135deg, rgba(16,120,70,0.12), rgba(52,211,153,0.07))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: 'rgba(255,255,255,0.12)',
      }}>
        {!event.image && '◈'}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <h4 style={{
          margin: 0, fontSize: '0.78rem', fontWeight: 600,
          fontFamily: "'Orbitron', sans-serif", color: '#ccfce8', lineHeight: 1.3,
        }}>{event.title}</h4>
        <div style={{
          marginTop: 4, fontSize: '0.62rem',
          color: 'rgba(52,211,153,0.75)', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {event.date} · {event.time}
        </div>
      </div>
    </div>
  )
}

/* ── Side column wrapper ─────────────────────────────────────────────────── */
function SideColumn({ title, events, color, onClickEvent }: {
  title: string; events: Event[]; color: string; onClickEvent?: (i: number) => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      overflowY: 'auto', padding: '0 8px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(52,211,153,0.15) transparent',
    }}>
      <h3 style={{
        margin: 0, fontSize: '0.7rem', fontWeight: 500,
        fontFamily: "'Orbitron', sans-serif", color,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>{title}</h3>
      {events.map((ev, i) => (
        <SideCard key={i} event={ev} onClick={() => onClickEvent?.(i)} />
      ))}
    </div>
  )
}

/* ── Tab button style ────────────────────────────────────────────────────── */
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px', borderRadius: 8,
  border: active ? '1px solid rgba(52,211,153,0.6)' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
  color: active ? '#34d399' : 'rgba(255,255,255,0.45)',
  fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(6px)',
})

/* ── Arrow button style ──────────────────────────────────────────────────── */
const arrowBtnStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  zIndex: 10, width: 40, height: 40, borderRadius: '50%',
  background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.5)',
  color: '#34d399', fontSize: '1.4rem', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)', transition: 'all 0.2s',
  boxShadow: '0 0 14px rgba(52,211,153,0.2)',
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function OldMess({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('live')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const centerEvent = tab === 'live'
    ? liveEvent
    : tab === 'upcoming'
      ? upcomingEvents[selectedIdx] || upcomingEvents[0]
      : pastEvents[selectedIdx] || pastEvents[0]

  const centerBadge = tab === 'live'
    ? '● LIVE'
    : tab === 'upcoming'
      ? 'UPCOMING'
      : 'PAST'

  const leftTitle = tab === 'past' ? 'Happening Now' : 'Past Events'
  const leftEvents = tab === 'past' ? [liveEvent] : pastEvents
  const leftColor = tab === 'past' ? '#ff6b6b' : 'rgba(255,255,255,0.3)'

  const rightTitle = tab === 'upcoming' ? 'Happening Now' : 'Upcoming'
  const rightEvents = tab === 'upcoming' ? [liveEvent] : upcomingEvents
  const rightColor = tab === 'upcoming' ? '#ff6b6b' : '#34d399'

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

        {/* ── Three-column layout ── */}
        <div className="oldmess-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          gap: 24, flex: 1, minHeight: 0,
        }}>
          {/* Left */}
          <SideColumn
            title={leftTitle}
            events={leftEvents}
            color={leftColor}
          />

          {/* Center */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {tab !== 'live' && (
                <>
                  <button
                    onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                    disabled={selectedIdx === 0}
                    style={{
                      ...arrowBtnStyle,
                      left: -18,
                      opacity: selectedIdx === 0 ? 0.25 : 1,
                      cursor: selectedIdx === 0 ? 'default' : 'pointer',
                    }}
                  >‹</button>
                  <button
                    onClick={() => {
                      const max = (tab === 'upcoming' ? upcomingEvents : pastEvents).length - 1
                      setSelectedIdx(i => Math.min(max, i + 1))
                    }}
                    disabled={selectedIdx === (tab === 'upcoming' ? upcomingEvents : pastEvents).length - 1}
                    style={{
                      ...arrowBtnStyle,
                      right: -18,
                      opacity: selectedIdx === (tab === 'upcoming' ? upcomingEvents : pastEvents).length - 1 ? 0.25 : 1,
                      cursor: selectedIdx === (tab === 'upcoming' ? upcomingEvents : pastEvents).length - 1 ? 'default' : 'pointer',
                    }}
                  >›</button>
                </>
              )}
              <div
                key={tab + selectedIdx}
                style={{
                  height: '100%',
                  animation: 'oldmess-center-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <FeaturedEventCard event={centerEvent} badge={centerBadge} />
              </div>
            </div>

            {/* Dot indicators */}
            {tab !== 'live' && (
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 10,
                marginTop: 16, flexShrink: 0,
              }}>
                {(tab === 'upcoming' ? upcomingEvents : pastEvents).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    style={{
                      width: 8, height: 8, borderRadius: '50%', border: 'none',
                      background: i === selectedIdx ? '#34d399' : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer', transition: 'background 0.2s, transform 0.2s',
                      transform: i === selectedIdx ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right */}
          <SideColumn
            title={rightTitle}
            events={rightEvents}
            color={rightColor}
            onClickEvent={tab === 'live' ? undefined : undefined}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes oldmess-center-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Mobile: stack columns top-to-bottom ── */
        @media (max-width: 768px) {
          .oldmess-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto;
            flex: unset !important;
            min-height: unset !important;
          }

          .oldmess-grid > div {
            min-height: unset !important;
          }
        }
      `}</style>
    </div>
  )
}