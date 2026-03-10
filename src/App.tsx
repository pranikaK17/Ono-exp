// src/App.tsx
import { useState } from 'react'
import Map from './components/map/Map'
import AB1 from './components/pages/AB1'
import GrandStairs from './components/pages/GrandStairs'
import AB2 from './components/pages/AB2'


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
    </>
  )
}
