import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
CalendarDays,
ChevronLeft,
ChevronRight,
CircleAlert,
RefreshCw,
} from 'lucide-react'
import {
getAllTasks,
type ApiGlobalTask,
type ApiTaskPriority,
} from '../lib/api'

const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const priorityLabels: Record<ApiTaskPriority, string> = {
LOW: 'Низький',
MEDIUM: 'Середній',
HIGH: 'Високий',
}

const priorityClasses: Record<ApiTaskPriority, string> = {
LOW: 'bg-slate-100 text-slate-600',
MEDIUM: 'bg-blue-50 text-blue-700',
HIGH: 'bg-rose-50 text-rose-700',
}

const priorityOrder: Record<ApiTaskPriority, number> = {
HIGH: 0,
MEDIUM: 1,
LOW: 2,
}

function toDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDueDateKey(value: string | null) {
return value ? toDayKey(new Date(value)) : null
}

function startOfDay(value = new Date()) {
const date = new Date(value)
date.setHours(0, 0, 0, 0)

return date
}

function isOverdue(value: string | null) {
if (!value) {
return false
}

return startOfDay(new Date(value)) < startOfDay()
}

function isOpenTask(task: ApiGlobalTask) {
return task.status === 'TODO' || task.status === 'IN_PROGRESS'
}

function formatMonth(value: Date) {
const result = new Intl.DateTimeFormat('uk-UA', {
month: 'long',
year: 'numeric',
}).format(value)

return result.charAt(0).toUpperCase() + result.slice(1)
}

function getMonthGrid(month: Date) {
const firstDay = new Date(
month.getFullYear(),
month.getMonth(),
1,
)

const mondayOffset = (firstDay.getDay() + 6) % 7

return Array.from({ length: 42 }, (_, index) => {
return new Date(
month.getFullYear(),
month.getMonth(),
1 - mondayOffset + index,
)
})
}

function StatCard({
label,
value,
valueClassName,
}: {
label: string
value: number
valueClassName: string
}) {
return (
<article className="rounded-2xl bg-white p-4 shadow-sm">
<p className="text-sm font-medium text-slate-500">{label}</p>

  <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>
    {value}
  </p>
</article>

)
}

export function CalendarPage() {
const [tasks, setTasks] = useState<ApiGlobalTask[]>([])
const [currentMonth, setCurrentMonth] = useState(
() => new Date(),
)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')

async function loadTasks() {
try {
setIsLoading(true)
setError('')

  const data = await getAllTasks()
  setTasks(data)
} catch (requestError) {
  setError(
    requestError instanceof Error
      ? requestError.message
      : 'Не вдалося завантажити календар',
  )
} finally {
  setIsLoading(false)
}

}

useEffect(() => {
void loadTasks()
}, [])

const openTasks = useMemo(() => {
return tasks.filter(isOpenTask)
}, [tasks])

const tasksByDate = useMemo(() => {
const grouped = new Map<string, ApiGlobalTask[]>()

for (const task of openTasks) {
  const dateKey = getDueDateKey(task.dueDate)

  if (!dateKey) {
    continue
  }

  const items = grouped.get(dateKey) ?? []
  items.push(task)
  grouped.set(dateKey, items)
}

for (const items of grouped.values()) {
  items.sort(
    (first, second) =>
      priorityOrder[first.priority] -
      priorityOrder[second.priority],
  )
}

return grouped

}, [openTasks])

const days = useMemo(() => {
return getMonthGrid(currentMonth)
}, [currentMonth])

const withoutDeadlineTasks = useMemo(() => {
return openTasks.filter((task) => !task.dueDate)
}, [openTasks])

const statistics = useMemo(() => {
const todayKey = toDayKey(new Date())
const weekLimit = new Date()
weekLimit.setDate(weekLimit.getDate() + 7)
const weekLimitKey = toDayKey(weekLimit)

return {
  overdue: openTasks.filter((task) =>
    isOverdue(task.dueDate),
  ).length,
  today: openTasks.filter(
    (task) => getDueDateKey(task.dueDate) === todayKey,
  ).length,
  nextWeek: openTasks.filter((task) => {
    const taskDateKey = getDueDateKey(task.dueDate)

    return Boolean(
      taskDateKey &&
        taskDateKey > todayKey &&
        taskDateKey <= weekLimitKey,
    )
  }).length,
  withoutDeadline: withoutDeadlineTasks.length,
}

}, [openTasks, withoutDeadlineTasks.length])

function showPreviousMonth() {
setCurrentMonth(
(month) =>
new Date(month.getFullYear(), month.getMonth() - 1, 1),
)
}

function showNextMonth() {
setCurrentMonth(
(month) =>
new Date(month.getFullYear(), month.getMonth() + 1, 1),
)
}

function showCurrentMonth() {
setCurrentMonth(new Date())
}

return (
<main className="min-h-screen bg-slate-50">
<div className="mx-auto max-w-7xl p-5 sm:p-7">
<header className="flex flex-wrap items-start justify-between gap-4">
<div>
<p className="text-sm font-semibold text-blue-600">
SOLAR CRM
</p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Календар
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Дедлайни активних завдань по всіх проєктах
        </p>
      </div>

      <button
        type="button"
        onClick={() => void loadTasks()}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw size={16} />
        Оновити
      </button>
    </header>

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Прострочені"
        value={statistics.overdue}
        valueClassName="text-rose-600"
      />

      <StatCard
        label="На сьогодні"
        value={statistics.today}
        valueClassName="text-amber-600"
      />

      <StatCard
        label="Наступні 7 днів"
        value={statistics.nextWeek}
        valueClassName="text-blue-600"
      />

      <StatCard
        label="Без дедлайну"
        value={statistics.withoutDeadline}
        valueClassName="text-slate-700"
      />
    </section>

    <section className="mt-7 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-blue-600" />

          <h2 className="text-xl font-bold text-slate-900">
            {formatMonth(currentMonth)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showCurrentMonth}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Сьогодні
          </button>

          <button
            type="button"
            onClick={showPreviousMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            title="Попередній місяць"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            onClick={showNextMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            title="Наступний місяць"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-slate-500">
          Завантаження календаря...
        </p>
      ) : error ? (
        <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-7 border-b border-slate-200">
              {weekdayLabels.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-l border-t border-slate-200">
              {days.map((day) => {
                const dayKey = toDayKey(day)
                const tasksForDay = tasksByDate.get(dayKey) ?? []
                const isCurrentMonth =
                  day.getMonth() === currentMonth.getMonth()
                const isToday = dayKey === toDayKey(new Date())

                return (
                  <div
                    key={dayKey}
                    className={`min-h-36 border-b border-r border-slate-200 p-2 ${
                      isCurrentMonth
                        ? 'bg-white'
                        : 'bg-slate-50/70'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {tasksForDay.length > 0 && (
                        <span className="text-xs font-semibold text-slate-400">
                          {tasksForDay.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {tasksForDay.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          to={`/projects/${task.project.id}`}
                          title={`${task.title} — ${task.project.name}`}
                          className={`block truncate rounded-lg px-2 py-1 text-xs font-semibold transition hover:brightness-95 ${priorityClasses[task.priority]}`}
                        >
                          {task.title}
                        </Link>
                      ))}

                      {tasksForDay.length > 3 && (
                        <p className="px-1 text-xs font-semibold text-slate-500">
                          + ще {tasksForDay.length - 3}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>

    {withoutDeadlineTasks.length > 0 && (
      <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <CircleAlert size={21} className="text-amber-500" />

          <h2 className="text-lg font-bold text-slate-900">
            Завдання без дедлайну
          </h2>
        </div>

        <div className="mt-5 space-y-3">
          {withoutDeadlineTasks.map((task) => (
            <article
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"
            >
              <div className="min-w-0">
                <Link
                  to={`/projects/${task.project.id}`}
                  className="font-semibold text-slate-900 hover:text-blue-600"
                >
                  {task.title}
                </Link>

                <p className="mt-1 text-sm text-slate-500">
                  {task.project.name}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}
              >
                {priorityLabels[task.priority]}
              </span>
            </article>
          ))}
        </div>
      </section>
    )}
  </div>
</main>)}