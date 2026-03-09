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
  title: 'Neon Nights — Battle of Bands',
  date: 'Mar 9, 2026',
  time: 'LIVE NOW',
  venue: 'AB1 — Main Stage',
  description: 'Electrifying live performances from 8 college bands competing for the crown.',
  image: '',
  link: '#',
}

const upcomingEvents: Event[] = [
  {
    title: 'Stand-Up Showdown',
    date: 'Mar 16, 2026',
    time: '7:30 PM',
    venue: 'AB1 — Auditorium',
    description: 'An evening of laughs with the best campus comedians and a surprise guest.',
    image: '',
  },
  {
    title: 'Synth Wave DJ Night',
    date: 'Mar 17, 2026',
    time: '9:00 PM',
    venue: 'AB1 — Open Arena',
    description: 'Retro-futuristic beats under the neon sky. Glow sticks mandatory.',
    image: '',
  },
  {
    title: 'Indie Film Screening',
    date: 'Mar 18, 2026',
    time: '6:00 PM',
    venue: 'AB1 — Seminar Hall',
    description: 'A curated selection of short films by student filmmakers.',
    image: '',
  },
]

const pastEvents: Event[] = [
  {
    title: 'Acoustic Unplugged',
    date: 'Feb 20, 2026',
    time: '5:00 PM',
    venue: 'AB1 — Courtyard',
    description: 'Soulful acoustic sets from indie artists — a mellow evening to remember.',
    image: '',
  },
  {
    title: 'Poetry Slam',
    date: 'Feb 18, 2026',
    time: '4:00 PM',
    venue: 'AB1 — Seminar Hall',
    description: 'Words that hit hard. The best spoken word artists battled it out.',
    image: '',
  },
  {
    title: 'Open Mic Night',
    date: 'Feb 10, 2026',
    time: '7:00 PM',
    venue: 'AB1 — Main Stage',
    description: 'Raw talent, no filters. Singers, poets, comedians — anyone could take the stage.',
    image: '',
  },
]

/* ── Side card (past / upcoming) ─────────────────────────────────────────── */
function SideCard({ event }: { event: Event }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(77,216,230,0.12)',
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.3s, transform 0.3s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(77,216,230,0.35)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(77,216,230,0.12)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 80,
        background: event.image
          ? `url(${event.image}) center/cover`
          : 'linear-gradient(135deg, rgba(77,216,230,0.08), rgba(160,60,255,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: 'rgba(255,255,255,0.12)',
      }}>
        {!event.image && '♫'}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <h4 style={{
          margin: 0, fontSize: '0.78rem', fontWeight: 600,
          fontFamily: "'Orbitron', sans-serif",
          color: '#d0e8f0', lineHeight: 1.3,
        }}>{event.title}</h4>
        <div style={{
          marginTop: 4, fontSize: '0.62rem',
          color: 'rgba(77,216,230,0.65)', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {event.date} · {event.time}
        </div>
      </div>
    </div>
  )
}

/* ── Tab button style ────────────────────────────────────────────────────── */
const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 24px',
  borderRadius: 8,
  border: active ? '1px solid rgba(77,216,230,0.5)' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(77,216,230,0.12)' : 'rgba(255,255,255,0.04)',
  color: active ? '#4dd8e6' : 'rgba(255,255,255,0.45)',
  fontFamily: "'Orbitron', sans-serif",
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  transition: 'all 0.25s',
  backdropFilter: 'blur(6px)',
})

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AB1({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'live' | 'info' | 'upcoming'>('live')
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

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
          <button style={tabStyle(tab === 'info')} onClick={() => setTab('info')}>Info Board</button>
          <button style={tabStyle(tab === 'live')} onClick={() => setTab('live')}>Happening Now</button>
          <button style={tabStyle(tab === 'upcoming')} onClick={() => setTab('upcoming')}>Upcoming</button>
        </div>

        {/* ── Three-column layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          gap: 24,
          flex: 1,
          minHeight: 0,
        }}>

          {/* ── Left column: Past events ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            overflowY: 'auto',
            paddingRight: 8,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(77,216,230,0.15) transparent',
          }}>
            <h3 style={{
              margin: 0, fontSize: '0.7rem', fontWeight: 500,
              fontFamily: "'Orbitron', sans-serif",
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>Past Events</h3>
            {pastEvents.map((ev, i) => <SideCard key={i} event={ev} />)}
          </div>

          {/* ── Center: Live / featured event ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(77,216,230,0.2)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            {/* Large image area */}
            <div style={{
              flex: 1, minHeight: 280,
              background: liveEvent.image
                ? `url(${liveEvent.image}) center/cover`
                : 'linear-gradient(135deg, rgba(77,216,230,0.06), rgba(160,60,255,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {!liveEvent.image && (
                <span style={{
                  fontSize: 72, color: 'rgba(255,255,255,0.06)',
                }}>♫</span>
              )}
              {/* Live badge */}
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(255, 50, 50, 0.85)',
                color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                padding: '4px 14px', borderRadius: 6,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                animation: 'pulse-live 2s ease-in-out infinite',
              }}>● LIVE</div>
            </div>

            {/* Event info */}
            <div style={{
              padding: '24px 28px',
              background: 'rgba(0,0,0,0.3)',
              borderTop: '1px solid rgba(77,216,230,0.1)',
            }}>
              <h2 style={{
                margin: 0, fontSize: '1.35rem', fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                color: '#e0f0ff',
              }}>{liveEvent.title}</h2>

              <div style={{
                display: 'flex', gap: 20, marginTop: 10,
                fontSize: '0.75rem', fontFamily: "'Exo 2', sans-serif",
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <span style={{ color: 'rgba(77,216,230,0.8)' }}>{liveEvent.date}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span style={{ color: '#ff6b6b', fontWeight: 600 }}>{liveEvent.time}</span>
              </div>

              <div style={{
                marginTop: 6, fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.35)',
                fontFamily: "'Exo 2', sans-serif",
                letterSpacing: '0.04em',
              }}>{liveEvent.venue}</div>

              <p style={{
                margin: '14px 0 0', fontSize: '0.85rem', lineHeight: 1.6,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: "'Manrope', sans-serif",
              }}>{liveEvent.description}</p>

              {/* Links */}
              <div style={{
                marginTop: 18, paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 12,
              }}>
                <a href={liveEvent.link || '#'} style={{
                  padding: '8px 22px', borderRadius: 8,
                  background: 'rgba(77,216,230,0.15)',
                  border: '1px solid rgba(77,216,230,0.3)',
                  color: '#4dd8e6', fontSize: '0.72rem', fontWeight: 600,
                  fontFamily: "'Orbitron', sans-serif",
                  textDecoration: 'none', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}>Watch Stream</a>
                <a href="#" style={{
                  padding: '8px 22px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600,
                  fontFamily: "'Orbitron', sans-serif",
                  textDecoration: 'none', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}>Details</a>
              </div>
            </div>
          </div>

          {/* ── Right column: Upcoming events ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            overflowY: 'auto',
            paddingLeft: 8,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(77,216,230,0.15) transparent',
          }}>
            <h3 style={{
              margin: 0, fontSize: '0.7rem', fontWeight: 500,
              fontFamily: "'Orbitron', sans-serif",
              color: '#4dd8e6',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              paddingBottom: 8, borderBottom: '1px solid rgba(77,216,230,0.1)',
            }}>Upcoming</h3>
            {upcomingEvents.map((ev, i) => <SideCard key={i} event={ev} />)}
          </div>
        </div>
      </div>

      {/* Live badge pulse animation */}
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
