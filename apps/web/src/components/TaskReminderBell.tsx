import { useEffect, useMemo, useState } from 'react'
import { Bell, CircleAlert, Clock3 } from 'lucide-react'
import { Link } from 'react-router'
import {
  getAllTasks,
  type ApiGlobalTask,
} from '../lib/api'

type ReminderKind = 'OVERDUE' | 'TODAY'

function startOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)

  return date
}

function getReminderKind(
  task: ApiGlobalTask,
): ReminderKind | null {
  if (!task.dueDate) {
    return null
  }

  if (
    task.status !== 'TODO' &&
    task.status !== 'IN_PROGRESS'
  ) {
    return null
  }

  const dueDate = startOfDay(new Date(task.dueDate))
  const today = startOfDay()

  if (dueDate < today) {
    return 'OVERDUE'
  }

  if (dueDate.getTime() === today.getTime()) {
    return 'TODAY'
  }

  return null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function TaskReminderBell() {
  const [tasks, setTasks] = useState<ApiGlobalTask[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  async function loadTasks() {
    try {
      const data = await getAllTasks()

      setTasks(data)
      setError('')
    } catch {
      setError('Не вдалося завантажити нагадування')
    }
  }

  useEffect(() => {
    void loadTasks()

    const timer = window.setInterval(() => {
      void loadTasks()
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  const reminders = useMemo(() => {
    return tasks
      .filter((task) => getReminderKind(task) !== null)
      .sort((first, second) => {
        const firstKind = getReminderKind(first)
        const secondKind = getReminderKind(second)

        if (firstKind !== secondKind) {
          return firstKind === 'OVERDUE' ? -1 : 1
        }

        const firstDate = first.dueDate
          ? new Date(first.dueDate).getTime()
          : 0

        const secondDate = second.dueDate
          ? new Date(second.dueDate).getTime()
          : 0

        return firstDate - secondDate
      })
  }, [tasks])

  const overdueCount = reminders.filter(
    (task) => getReminderKind(task) === 'OVERDUE',
  ).length

  const todayCount = reminders.filter(
    (task) => getReminderKind(task) === 'TODAY',
  ).length

  const hasOverdue = overdueCount > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`relative rounded-xl border p-2 transition ${
          reminders.length > 0
            ? hasOverdue
              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
        title="Нагадування"
        aria-label="Нагадування"
        aria-expanded={isOpen}
      >
        <Bell size={19} />

        {reminders.length > 0 && (
          <span
            className={`absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              hasOverdue ? 'bg-rose-600' : 'bg-amber-500'
            }`}
          >
            {reminders.length > 9 ? '9+' : reminders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <CircleAlert size={18} className="text-amber-500" />
                <h2 className="font-bold text-slate-900">
                  Нагадування
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {overdueCount > 0
                  ? `Прострочено: ${overdueCount}`
                  : `На сьогодні: ${todayCount}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          {error ? (
            <p className="p-4 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : reminders.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Немає прострочених або запланованих на сьогодні завдань.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2">
              {reminders.slice(0, 5).map((task) => {
                const kind = getReminderKind(task)
                const isOverdue = kind === 'OVERDUE'

                return (
                  <Link
                    key={task.id}
                    to={`/projects/${task.project.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-xl p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                        {task.title}
                      </p>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isOverdue ? 'Прострочено' : 'Сьогодні'}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {task.project.name}
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        isOverdue
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {formatDate(task.dueDate!)}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}

          <Link
            to="/tasks"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Усі завдання
            <Clock3 size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}