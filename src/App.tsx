// src/App.tsx
import { useState } from 'react'
import Map from './components/map/Map'
import AB1 from './components/pages/AB1'
import GrandStairs from './components/pages/GrandStairs'
import AB2 from './components/pages/AB2'
import AB3 from './components/pages/AB3'
import LHC from './components/pages/LHC'
import OldMess from './components/pages/OldMess'

export default function App() {
  const [page, setPage] = useState<string | null>(null)

  const handlePinClick = (name: string) => {
    setPage(prev => prev === name ? null : name)
  }

  return (
    <>
      <Map onPinClick={handlePinClick} activePage={page} />
      {page === 'AB1' && <AB1 onClose={() => setPage(null)} />}
      {page === 'GrandStairs' && <GrandStairs onClose={() => setPage(null)} />}
      {page === 'AB2' && <AB2 onClose={() => setPage(null)} />}
      {page === 'AB3' && <AB3 onClose={() => setPage(null)} />}
      {page === 'OldMess' && <OldMess onClose={() => setPage(null)} />}
      {page === 'LHC' && <LHC onClose={() => setPage(null)} />}
    </>
  )
}
