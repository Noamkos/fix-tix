import { Outlet } from 'react-router'
import { DemoDock } from './DemoDock.jsx'

// Wraps every screen: the page itself, plus the presenter's Demo button.
export function RootLayout() {
  return (
    <>
      <Outlet />
      <DemoDock />
    </>
  )
}
