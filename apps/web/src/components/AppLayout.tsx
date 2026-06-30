import {
  CalendarDays,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Sun,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { TaskReminderBell } from './TaskReminderBell'

const navItems = [
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
  },
  {
    to: '/tasks',
    label: 'Завдання',
    icon: ClipboardList,
  },
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
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-7">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sun size={20} />
            </span>

            <span className="text-base font-bold tracking-tight text-slate-900">
              SOLAR CRM
            </span>
          </NavLink>

          <div className="flex flex-wrap items-center gap-2">
            <nav
              className="flex flex-wrap items-center gap-1"
              aria-label="Основна навігація"
            >
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
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

            <TaskReminderBell />
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  )
}