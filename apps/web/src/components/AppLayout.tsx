import {
  CalendarDays,
  FolderKanban,
  LogOut,
  UserRound,
} from 'lucide-react'
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  {
    to: '/calendar',
    label: 'Календар',
    icon: CalendarDays,
  },
  {
    to: '/projects',
    label: 'Проєкти',
    icon: FolderKanban,
  },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-7">
          <NavLink
            to="/projects"
            aria-label="Leo Energy CRM — проєкти"
            className="flex min-w-0 items-center gap-2.5"
          >
            <img
  src="/leo-energy-logo.png"
  alt="Leo Energy CRM"
  className="h-12 w-auto shrink-0 object-contain"
/>
          </NavLink>

          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Основна навігація"
          >
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 xl:flex">
              <UserRound size={17} />

              <span className="max-w-40 truncate">
                {user?.fullName ?? 'Користувач'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Вийти з облікового запису"
              aria-label="Вийти з облікового запису"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 sm:px-3"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>
        </div>
      </header>

      <Outlet />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="Мобільна навігація"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 active:bg-slate-100'
                  }`
                }
              >
                <Icon size={19} />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}