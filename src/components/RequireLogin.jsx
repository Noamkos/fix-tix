import { Navigate, useLocation } from 'react-router'
import { useStore } from '../store/useStore.js'
import { getCurrentUser } from '../lib/selectors.js'

// Pages for logged-in fans only. Anyone else goes to Login, then comes straight back.
export function RequireLogin({ children }) {
  const user = useStore(getCurrentUser)
  const { pathname, search } = useLocation()
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  return children
}
