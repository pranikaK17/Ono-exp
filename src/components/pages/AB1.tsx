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
  /* ── 13 March Events ── */
  {
    title: "Panacea (Tech Titans: The Final Quiz Battle)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 026, 027",
    description: "The ultimate tech quiz showdown. Put your knowledge to the test and battle it out to be crowned the Tech Titan.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "OMPHALOS (Among Us in Real Life 2.0)",
    date: "13 March, 2026", time: "12:30 pm - 4 pm", venue: "AB1 117A-D, 118A-D",
    description: "Experience the thrill of Among Us in the real world. Tasks, saboteurs, and emergency meetings — can you survive the round?",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T16:00:00",
  },
  {
    title: "International Relations Council (It's a Match)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 107, 108",
    description: "A diplomatic simulation and networking event. Find your strategic match and navigate the complex world of international relations.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "HER CAMPUS (Yes, & You?! 3.0)",
    date: "13 March, 2026", time: "2 pm - 5 pm", venue: "AB1 126, 127",
    description: "An empowering workshop and open discussion focused on creativity, collaboration, and finding your voice.",
    image: "",
    startTime: "2026-03-13T14:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "IEEE CIS MUJ (AI Model Quest)",
    date: "13 March, 2026", time: "3 pm - 5 pm", venue: "AB1 212, 213",
    description: "A quest for the most efficient and innovative AI models. Challenge your coding skills and build local AI solutions.",
    image: "",
    startTime: "2026-03-13T15:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 307",
    description: "Immerse yourself in the Cyber Sphere. Exploring 360-degree security, ethical hacking, and the future of cyberspace.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 312, 313, 314, 327, 329",
    description: "Extended labs for Cyber Sphere 360. Hands-on sessions covering network security and penetration testing.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "IEEE WIE MUJ (CROWN CONQUEST)",
    date: "13 March, 2026", time: "12:30 pm - 3 pm", venue: "AB1 007, 008",
    description: "A leadership and talent competition by Women in Engineering. Prove your skills and claim the crown.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T15:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 328",
    description: "Specialized focus on digital forensics and incident response within the Cyber Sphere 360 ecosystem.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Devforge (The Hiring Heist)",
    date: "13 March, 2026", time: "2 pm - 5 pm", venue: "AB1 308",
    description: "A simulation of high-stakes recruitment. Navigate the interview heist and secure your place in the top tech forge.",
    image: "",
    startTime: "2026-03-13T14:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 311",
    description: "Cyber security briefing and interactive workshops. Learn the art of defending the perimeter.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },

  /* ── 14 March Events ── */
  {
    title: "Turing Sapiens (TuringPrompt)",
    date: "14 March, 2026", time: "9 am - 12 pm", venue: "AB1 026, 027",
    description: "Master the art of prompt engineering. Challenge Turing Sapiens in this creative and technical AI interaction battle.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T12:00:00",
  },
  {
    title: "Marksoc (FANBASE FACE-OFF)",
    date: "14 March, 2026", time: "2 pm - 5 pm", venue: "AB1 026, 027",
    description: "Which fanbase reigns supreme? A high-energy marketing and fan-culture debate competition.",
    image: "",
    startTime: "2026-03-14T14:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Coreo (Ground 0)",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 014, 015",
    description: "The foundations of dance and movement. Witness raw talent and rhythmic power as Coreo takes over Ground 0.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "ACM Student Chapter (Interstellar Mission: The Chrono Protocol)",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 110, 111, 112, 113, 114",
    description: "A multi-room immersive mission through space and time. Solve the Chrono Protocol to save the mission.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "OMPHALOS (Among Us in Real Life 2.0)",
    date: "14 March, 2026", time: "9 am - 4 pm", venue: "AB1 117A-D, 118A-D",
    description: "Day 2 of Among Us IRL. Higher stakes, new tasks, and even more cunning imposters.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T16:00:00",
  },
  {
    title: "NEXUS MUJ (Mission: Orbital Code Red)",
    date: "14 March, 2026", time: "1 pm - 5 pm", venue: "AB1 119 & 120",
    description: "A high-intensity coding challenge in orbit. Debug and deploy under Code Red conditions.",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "HER CAMPUS (Yes, & You?! 3.0)",
    date: "14 March, 2026", time: "1 pm - 4 pm", venue: "AB1 126, 127",
    description: "Part 2 of the Her Campus empower-session. Continuing the journey of discovery and collaborative creativity.",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T16:00:00",
  },
  {
    title: "Managia (Traitors)",
    date: "14 March, 2026", time: "10 am - 5 pm", venue: "AB1 224A, 224B, 225–229",
    description: "A game of psychological strategy and management. Identify the traitors before they sabotage the team.",
    image: "",
    startTime: "2026-03-14T10:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "COSMOS (Quigencia 9.0: The Cosmic Auction Edition)",
    date: "14 March, 2026", time: "11 am - 3 pm", venue: "AB1 307",
    description: "The ultimate auction strategy battle. Bid for cosmic assets and build the strongest empire in this 9.0 edition.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T15:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 312, 313, 314, 327, 329",
    description: "Full-day immersive cyber-security drills and advanced red-teaming simulations.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "IEEE SB (CHECKMATE)",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 018, 019, 020, 007",
    description: "A strategic engineering challenge where every move counts. Reach Checkmate by solving complex technical problems.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "EIS (CEO FOR A DAY)",
    date: "14 March, 2026", time: "1 pm - 5 pm", venue: "AB1 328",
    description: "Step into the shoes of a corporate leader. Solve executive dilemmas and lead your company through the challenge.",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 322, 321B",
    description: "Exploring the dark web and investigating cyber threats in the specialized Cyber Sphere modules.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "EIS (CEO FOR A DAY)",
    date: "14 March, 2026", time: "1 pm - 5 pm", venue: "AB1 308, 309, 310",
    description: "The boardroom experience. Pitch your vision and make the tough calls in this management simulation.",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "EIS (CEO FOR A DAY)",
    date: "14 March, 2026", time: "1 pm - 5 pm", venue: "AB1 311",
    description: "Executive presentation and leadership evaluation. Can you handle the pressure of the top floor?",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T17:00:00",
  },

  /* ── 15 March Events ── */
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "15 March, 2026", time: "9 am - 5 pm", venue: "AB1 307",
    description: "The final day of the Cyber Sphere. Bringing together all the defense strategies learned.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "15 March, 2026", time: "9 am - 5 pm", venue: "AB1 312, 313, 314, 327, 329",
    description: "Concluding the hands-on technical labs for Cyber Sphere 360.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "15 March, 2026", time: "9 am - 5 pm", venue: "AB1 328",
    description: "Final forensic project wrap-up and digital evidence showcase.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  },
  {
    title: "Cyber Space Club (Cyber Sphere 360)",
    date: "15 March, 2026", time: "9 am - 5 pm", venue: "AB1 311",
    description: "Certification ceremony and final briefing for the Cyber Sphere 360 participants.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  },
];

// 2. Fallback for when there are no live events
const noLiveEventFallback: Event = {
  title: 'No Live Events Currently',
  date: 'Check back later',
  time: '—',
  venue: 'AB1',
  description: 'There are no events happening right now in AB1. Browse our upcoming tabs to see what to look forward to!',
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
      border: '1px solid rgba(40,200,120,0.25)',
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
              background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(40,200,120,0.7)',
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
            : 'linear-gradient(90deg, rgba(30,180,100,0.8), rgba(80,255,150,0.6))',
        }} />
      )}

      <div style={{
        padding: '28px 50px', background: 'rgba(0,0,0,0.3)',
        borderTop: event.image ? '1px solid rgba(40,200,120,0.12)' : 'none',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {/* Badge inline when there's no image */}
        {!event.image && badge && (
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start',
            background: badge === '● LIVE' ? 'rgba(255,50,50,0.85)' : 'rgba(40,200,120,0.2)',
            border: `1px solid ${badge === '● LIVE' ? 'rgba(255,80,80,0.6)' : 'rgba(40,200,120,0.5)'}`,
            color: badge === '● LIVE' ? '#ff6b6b' : '#32ff96',
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
          fontFamily: "'Orbitron', sans-serif", color: '#f0fff8',
        }}>{event.title}</h2>
        <div style={{
          display: 'flex', gap: 20, marginTop: 10,
          fontSize: '0.75rem', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span style={{ color: 'rgba(40,200,120,0.9)' }}>{event.date}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: event.time === 'LIVE NOW' ? '#ff6b6b' : '#32ff96', fontWeight: 600 }}>{event.time}</span>
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
              background: 'rgba(40,200,120,0.15)', border: '1px solid rgba(40,200,120,0.4)',
              color: '#32ff96', fontSize: '0.72rem', fontWeight: 600,
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
        border: '1px solid rgba(40,200,120,0.15)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.3s, transform 0.3s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(40,200,120,0.4)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(40,200,120,0.15)'
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
          fontFamily: "'Orbitron', sans-serif", color: '#ccfff0', lineHeight: 1.3,
        }}>{event.title}</h4>
        <div style={{
          marginTop: 5, fontSize: '0.62rem',
          color: 'rgba(40,200,120,0.75)', fontFamily: "'Exo 2', sans-serif",
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {event.date}
        </div>
        <div style={{
          marginTop: 2, fontSize: '0.65rem', fontWeight: 600,
          color: '#32ff96', fontFamily: "'Exo 2', sans-serif",
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
  border: active ? '1px solid rgba(40,200,120,0.6)' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(40,200,120,0.15)' : 'rgba(255,255,255,0.04)',
  color: active ? '#32ff96' : 'rgba(255,255,255,0.45)',
  fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(6px)',
})

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AB1({ onClose }: { onClose: () => void }) {
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
  const rightColor = '#32ff96'


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
                        background: 'rgba(40,200,120,0.18)',
                        border: '1px solid rgba(40,200,120,0.45)',
                        color: '#32ff96', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        opacity: selectedIdx === 0 ? 0.2 : 1,
                        cursor: selectedIdx === 0 ? 'default' : 'pointer',
                      }}
                    >‹</button>
                  )}

                  <div
                    key={tab + selectedIdx}
                    style={{ animation: 'ab1-center-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
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
                        background: 'rgba(40,200,120,0.18)',
                        border: '1px solid rgba(40,200,120,0.45)',
                        color: '#32ff96', fontSize: '1rem',
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
                          background: i === selectedIdx ? '#32ff96' : 'rgba(255,255,255,0.18)',
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
        @keyframes ab1-center-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Mobile: stack columns top-to-bottom ── */
        @media (max-width: 768px) {
          .ab1-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto;
            flex: unset !important;
            min-height: unset !important;
          }

          .ab1-grid > div {
            min-height: unset !important;
          }
        }
      `}</style>
    </div>
  )
}
