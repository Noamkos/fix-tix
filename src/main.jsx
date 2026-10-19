import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router.jsx'
import { startTimers } from './fixtix/timers.js'
import './index.css'

// Reservations and waitlist offers expire on time, even if nobody touches the page.
startTimers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
