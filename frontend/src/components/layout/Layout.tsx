import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg text-slate-900">
            StudyForge
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link to="/documents" className="hover:text-slate-900">
              Documents
            </Link>
            <Link to="/quiz/setup" className="hover:text-slate-900">
              Quiz
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
