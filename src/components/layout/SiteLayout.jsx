import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { SiteHeader } from './SiteHeader.jsx'
import { SiteFooter } from './SiteFooter.jsx'

// Frame for every FixTix page (what buyers and sellers see).
export function SiteLayout() {
  useEffect(() => {
    document.title = 'FixTix | Safe & fair ticket resale'
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}
