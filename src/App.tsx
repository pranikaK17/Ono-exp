// src/App.tsx
import { useState, Suspense, lazy } from 'react'
import Map from './components/map/Map'

const AB1 = lazy(() => import('./components/pages/AB1'))
const GrandStairs = lazy(() => import('./components/pages/GrandStairs'))
const AB2 = lazy(() => import('./components/pages/AB2'))
const AB3 = lazy(() => import('./components/pages/AB3'))
const LHC = lazy(() => import('./components/pages/LHC'))
const OldMess = lazy(() => import('./components/pages/OldMess'))

export default function App() {
  const [page, setPage] = useState<string | null>(null)

  const handlePinClick = (name: string) => {
    setPage(prev => prev === name ? null : name)
  }

  return (
    <>
      <Map onPinClick={handlePinClick} activePage={page} />
      <Suspense fallback={null}>
        {page === 'AB1' && <AB1 onClose={() => setPage(null)} />}
        {page === 'GrandStairs' && <GrandStairs onClose={() => setPage(null)} />}
        {page === 'AB2' && <AB2 onClose={() => setPage(null)} />}
        {page === 'AB3' && <AB3 onClose={() => setPage(null)} />}
        {page === 'OldMess' && <OldMess onClose={() => setPage(null)} />}
        {page === 'LHC' && <LHC onClose={() => setPage(null)} />}
      </Suspense>
    </>
  )
}
