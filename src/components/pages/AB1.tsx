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
    title: "Tech Titans: The Final Quiz Battle / Panacea",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 026, 027",
    description: "The ultimate showdown for tech enthusiasts. Compete in rapid-fire rounds of science and technology trivia to prove your mental sharpess.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Among Us in Real Life 2.0 / OMPHALOS",
    date: "13 March, 2026", time: "12:30 pm - 4 pm", venue: "AB1 117A-D, 118A-D",
    description: "The cult game comes alive! Find the impostor, defend your crewmate status, and navigate deception in this immersive real-life experience.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T16:00:00",
  },
  {
    title: "It's a Match / International Relations Council",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB 1 107, 108",
    description: "A diplomatic simulation where participants negotiate, form alliances, and resolve global conflicts. Think Model UN meets speed dating for nations.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Yes, & You?! 3.0 / HER CAMPUS",
    date: "13 March, 2026", time: "1 pm - 5 pm", venue: "AB1 126 127",
    description: "A celebration of confidence and community. Join this beloved improv and affirmation fest designed to spark creativity and joy.",
    image: "",
    startTime: "2026-03-13T13:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "AI Model Quest / IEEE CIS MUJ",
    date: "13 March, 2026", time: "3 pm - 5 pm", venue: "AB1 212, 213",
    description: "Build and present AI models in this competitive quest. Showcase your machine learning skills from classification to generation.",
    image: "",
    startTime: "2026-03-13T15:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Cyber Sphere 360 / Cyber Space Club",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 307, 311, 312, 313, 314, 327, 328, 329",
    description: "A full-floor cybersecurity experience featuring CTF challenges, ethical hacking demos, and digital forensics puzzles.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "CROWN CONQUEST / IEEE WIE MUJ",
    date: "13 March, 2026", time: "12:30 pm - 3 pm", venue: "AB1 007, 008",
    description: "Empowering women in engineering through a high-stakes competitive challenge built to celebrate brilliance and technical skill.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T15:00:00",
  },
  {
    title: "The Hiring Heist / Devforge",
    date: "13 March, 2026", time: "2 pm - 5 pm", venue: "AB1 308",
    description: "A mock hiring competition. Pitch yourself, survive rapid interview rounds, and outshine rivals to land the fictional dream job.",
    image: "",
    startTime: "2026-03-13T14:00:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Nextrack 3.0 / MUJ ACM SIGBED STUDENT CHAPTER",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB 1 Lobby",
    description: "An embedded systems and IoT showcase in the AB1 lobby. Witness cutting-edge hardware projects from MUJ's best builders.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "YOUR Dreamscape / De Artistry club",
    date: "13 March, 2026", time: "12:30 pm - 4 pm", venue: "AB1 Cheffie",
    description: "Step into an immersive installation built from imagination. Explore a surreal world reflecting your own unique dreamscape.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T16:00:00",
  },
  {
    title: "The 2:17 AM Incident / De Artistry club",
    date: "13 March, 2026", time: "12:30 pm - 4 pm", venue: "AB1 Cheffie",
    description: "A mystery art experience that unfolds clue by clue. Piece together the story behind an eerie and thought-provoking installation.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T16:00:00",
  },
  {
    title: "Artful Earth 3.0 / Convergence",
    date: "13 March, 2026", time: "12:30 pm - 5 pm", venue: "AB1 Cheffie Lawn Right Side",
    description: "Where sustainability meets expression. Explore eco-conscious creative exhibits celebrating the planet through art.",
    image: "",
    startTime: "2026-03-13T12:30:00", endTime: "2026-03-13T17:00:00",
  },
  {
    title: "Monologue Competition / Cinephilia",
    date: "13 March, 2026", time: "3 pm - 5 pm", venue: "AB1 Cheffie Lawn Left Side",
    description: "One person, one stage, one story. A test of raw performance skill where every word and silence carries weight.",
    image: "",
    startTime: "2026-03-13T15:00:00", endTime: "2026-03-13T17:00:00",
  },

  /* ── 14 March Events ── */
  {
    title: "TuringPrompt / Turing Sapiens",
    date: "14 March, 2026", time: "10 am - 1 pm", venue: "AB1 026, 027",
    description: "A prompt engineering challenge. Craft the most effective AI inputs to solve real-world tasks with precision and creativity.",
    image: "",
    startTime: "2026-03-14T10:00:00", endTime: "2026-03-14T13:00:00",
  },
  {
    title: "FANBASE FACE-OFF / Marksoc",
    date: "14 March, 2026", time: "3 pm - 4 pm", venue: "AB1 026, 027",
    description: "Pop culture communities go head-to-head in a trivia and passion-fueled battle to see which fanbase is the most dedicated.",
    image: "",
    startTime: "2026-03-14T15:00:00", endTime: "2026-03-14T16:00:00",
  },
  {
    title: "Ground 0 / Coreographia",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 014, 015",
    description: "A full-day dance intensive where raw talent meets professional training through workshops, battles, and performances.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Interstellar Mission: The Chrono Protocol / ACM STUDENT CHAPTER",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 110, 111, 112, 113, 114",
    description: "An escape-room-meets-tech-challenge. Crack the protocol and solve time-sensitive puzzles to save the mission.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Among Us in Real Life 2.0 / OMPHALOS",
    date: "14 March, 2026", time: "9 am - 4 pm", venue: "AB1 117A-D, 118A-D",
    description: "Day 2 of the real-life Among Us experience. New impostors and trickier betrayals await. Can you trust anyone?",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T16:00:00",
  },
  {
    title: "Mission: Orbital Code Red / NEXUS MUJ",
    date: "14 March, 2026", time: "12 pm - 5 pm", venue: "AB1 119 & 120",
    description: "A space-themed coding crisis. Solve programming challenges against the clock to prevent catastrophic orbital failure.",
    image: "",
    startTime: "2026-03-14T12:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Yes, & You?! 3.0 / HER CAMPUS",
    date: "14 March, 2026", time: "1 pm - 5 pm", venue: "AB1 126 127",
    description: "Day 2 of affirmations and improv. A joyful space celebrating confidence and community connection.",
    image: "",
    startTime: "2026-03-14T13:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Traitors / Managia",
    date: "14 March, 2026", time: "10 am - 5 pm", venue: "AB1 224A-229",
    description: "A social deduction spectacle. Navigate a maze of trust, avoid traps, and survive the day as a non-traitor.",
    image: "",
    startTime: "2026-03-14T10:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Quigencia 9.0: The Cosmic Auction Edition / COSMOS",
    date: "14 March, 2026", time: "11 am - 3 pm", venue: "AB1 307",
    description: "Mind-bending quiz meets cosmic auction. Bid on clues and outsmart the galaxy to win the ultimate prize.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T15:00:00",
  },
  {
    title: "Cyber Sphere 360 / Cyber Space Club",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 312, 313, 314, 327, 329, 322, 321B",
    description: "Day 2 goes deeper with advanced challenges, live vulnerability demos, and full-scale digital war-games.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "CHECKMATE / IEEE SB",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 018, 019, 020, 007",
    description: "A multi-round technical quiz and problem-solving marathon where every right move advances you closer to victory.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "CEO FOR A DAY / EIS",
    date: "14 March, 2026", time: "12 pm - 5 pm", venue: "AB1 328, 308, 309, 310, 311",
    description: "Manage crises, pitch strategies, and lead your virtual company to success in this intense corporate simulation.",
    image: "",
    startTime: "2026-03-14T12:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Carnival / Rotaract",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB 1 Lobby near Subway",
    description: "The AB1 lobby transforms into a hub of games and stalls. Take a break and enjoy the lighter side of the fest.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "GROUND ZERO, SHOWCASE / Coreographia",
    date: "14 March, 2026", time: "11 am - 5 pm", venue: "AB 1 Lobby",
    description: "Live dance performances take over the AB1 lobby. Watch breathtaking routines spill into the hallways.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "YOUR Dreamscape / De Artistry club",
    date: "14 March, 2026", time: "11 am - 5 pm", venue: "AB1 Cheffie",
    description: "Day 2 of the immersive dreamscape installation. Discover new interpretations and surreal moments.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "The 2:17 AM Incident / De Artistry club",
    date: "14 March, 2026", time: "11 am - 5 pm", venue: "AB1 Cheffie",
    description: "The mystery deepens with new clues surfacing. Piece together the story before time runs out.",
    image: "",
    startTime: "2026-03-14T11:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "Artful Earth 3.0 / Convergence",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 Cheffie Lawn Right Side",
    description: "Eco-art installations and live creative sessions continue on the Cheffie Lawn.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },
  {
    title: "CHECKMATE / IEEE SB",
    date: "14 March, 2026", time: "9 am - 5 pm", venue: "AB1 Cheffie Lawn Left Side",
    description: "Technical problem-solving marathon. The stakes remain high in this competitive quiz finale.",
    image: "",
    startTime: "2026-03-14T09:00:00", endTime: "2026-03-14T17:00:00",
  },

  /* ── 15 March Events ── */
  {
    title: "Cyber Sphere 360 / Cyber Space Club",
    date: "15 March, 2026", time: "9 am - 5 pm", venue: "AB1 307, 311, 312, 313, 314, 327, 328, 329",
    description: "The grand cybersecurity finale. Closing challenges and awards to cap off three days of digital warfare.",
    image: "",
    startTime: "2026-03-15T09:00:00", endTime: "2026-03-15T17:00:00",
  }
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
