import { BarChart3, ClipboardList, FileText, Home as HomeIcon, Leaf, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { LeafDecoration } from '../common/LeafDecoration'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/documents', label: 'Documents', icon: FileText, end: false },
  { to: '/study', label: 'Study', icon: Sparkles, end: false },
  { to: '/quiz/setup', label: 'Quiz', icon: ClipboardList, end: false },
  { to: '/progress', label: 'Progress', icon: BarChart3, end: false },
] as const

function NavItems() {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-leaf-100 text-leaf-800'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  )
}

export function Layout() {
  return (
    <div className="min-h-screen flex bg-stone-50">
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-leaf-100 bg-white">
        <NavLink to="/" className="flex items-center gap-2 px-6 py-5">
          <Leaf className="h-6 w-6 text-leaf-600" />
          <span className="font-semibold text-lg text-stone-900">StudyForge</span>
        </NavLink>
        <nav className="flex-1 px-3 space-y-1">
          <NavItems />
        </nav>
        <div className="relative h-28 overflow-hidden">
          <LeafDecoration className="absolute inset-0 w-full h-full" />
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-leaf-100">
        <div className="flex items-center gap-2 px-4 py-3">
          <Leaf className="h-5 w-5 text-leaf-600" />
          <span className="font-semibold text-stone-900">StudyForge</span>
        </div>
        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
          <NavItems />
        </nav>
      </div>

      <main className="flex-1 min-w-0 pt-28 md:pt-10 px-4 py-8 md:px-10">
        <div className="max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
