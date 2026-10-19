import { Link } from 'react-router'
import { SearchX } from 'lucide-react'

// Any address the demo doesn't know.
export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface text-subtle">
        <SearchX className="size-7" />
      </span>
      <h1 className="mt-5 text-[28px] font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">We couldn't find the page you were looking for.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to events
      </Link>
    </section>
  )
}
