import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
CalendarDays,
CheckCircle2,
ClipboardList,
Filter,
RefreshCw,
Search,
Trash2,
} from 'lucide-react'
import {
deleteProjectTask,
getAllTasks,
updateProjectTask,
type ApiGlobalTask,
type ApiTaskPriority,
type ApiTaskStatus,
} from '../lib/api'
import { EditTaskPanel } from '../components/EditTaskPanel'

type DeadlineFilter =
| 'ALL'
| 'OVERDUE'
| 'TODAY'
| 'NEXT_7_DAYS'
| 'NO_DUE_DATE'

const statusLabels: Record<ApiTaskStatus, string> = {
TODO: 'Заплановано',
IN_PROGRESS: 'В роботі',
DONE: 'Виконано',
CANCELED: 'Скасовано',
}

const statusClasses: Record<ApiTaskStatus, string> = {
TODO: 'bg-slate-100 text-slate-700',
IN_PROGRESS: 'bg-amber-50 text-amber-700',
DONE: 'bg-emerald-50 text-emerald-700',
CANCELED: 'bg-rose-50 text-rose-700',
}

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

function startOfDay(value = new Date()) {
const date = new Date(value)
date.setHours(0, 0, 0, 0)
return date
}

function formatDate(value: string | null) {
if (!value) {
return 'Без дедлайну'
}

return new Intl.DateTimeFormat('uk-UA', {
day: '2-digit',
month: 'short',
year: 'numeric',
}).format(new Date(value))
}

function isOverdue(value: string | null) {
if (!value) {
return false
}

return startOfDay(new Date(value)) < startOfDay()
}

function isToday(value: string | null) {
if (!value) {
return false
}

return (
startOfDay(new Date(value)).getTime() === startOfDay().getTime()
)
}

function matchesDeadline(
task: ApiGlobalTask,
filter: DeadlineFilter,
) {
if (filter === 'ALL') {
return true
}

if (filter === 'NO_DUE_DATE') {
return task.dueDate === null
}

if (!task.dueDate) {
return false
}

if (filter === 'OVERDUE') {
return isOverdue(task.dueDate)
}

if (filter === 'TODAY') {
return isToday(task.dueDate)
}

const dueDate = startOfDay(new Date(task.dueDate))
const today = startOfDay()
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)

return dueDate > today && dueDate <= nextWeek
}

export function TasksPage() {
const [tasks, setTasks] = useState<ApiGlobalTask[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')
const [search, setSearch] = useState('')
const [statusFilter, setStatusFilter] = useState<
ApiTaskStatus | 'ALL'
>('ALL')
const [priorityFilter, setPriorityFilter] = useState<
ApiTaskPriority | 'ALL'
>('ALL')
const [deadlineFilter, setDeadlineFilter] =
useState<DeadlineFilter>('ALL')
const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(
null,
)
const [deletingTaskId, setDeletingTaskId] = useState<number | null>(
null,
)

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
      : 'Не вдалося завантажити завдання',
  )
} finally {
  setIsLoading(false)
}

}

useEffect(() => {
void loadTasks()
}, [])

const filteredTasks = useMemo(() => {
const query = search.trim().toLowerCase()

return tasks.filter((task) => {
  const matchesSearch =
    !query ||
    task.title.toLowerCase().includes(query) ||
    task.project.name.toLowerCase().includes(query) ||
    task.project.location?.toLowerCase().includes(query)

  const matchesStatus =
    statusFilter === 'ALL' || task.status === statusFilter

  const matchesPriority =
    priorityFilter === 'ALL' || task.priority === priorityFilter

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPriority &&
    matchesDeadline(task, deadlineFilter)
  )
})

}, [
deadlineFilter,
priorityFilter,
search,
statusFilter,
tasks,
])

const pendingTasks = tasks.filter(
(task) =>
task.status === 'TODO' || task.status === 'IN_PROGRESS',
).length

const overdueTasks = tasks.filter(
(task) =>
(task.status === 'TODO' || task.status === 'IN_PROGRESS') &&
isOverdue(task.dueDate),
).length

async function handleStatusChange(
task: ApiGlobalTask,
status: ApiTaskStatus,
) {
try {
setUpdatingTaskId(task.id)

  await updateProjectTask(task.id, { status })
  await loadTasks()
} catch (requestError) {
  window.alert(
    requestError instanceof Error
      ? requestError.message
      : 'Не вдалося оновити статус',
  )
} finally {
  setUpdatingTaskId(null)
}

}

async function handleDelete(task: ApiGlobalTask) {
const confirmed = window.confirm(
`Видалити завдання ${task.title}?`,
)

if (!confirmed) {
  return
}

try {
  setDeletingTaskId(task.id)

  await deleteProjectTask(task.id)
  await loadTasks()
} catch (requestError) {
  window.alert(
    requestError instanceof Error
      ? requestError.message
      : 'Не вдалося видалити завдання',
  )
} finally {
  setDeletingTaskId(null)
}

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
          Завдання
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Усі робочі задачі за проєктами
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

    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      <article className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Усього завдань
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {tasks.length}
        </p>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          У роботі
        </p>
        <p className="mt-2 text-3xl font-bold text-amber-600">
          {pendingTasks}
        </p>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Прострочені
        </p>
        <p className="mt-2 text-3xl font-bold text-rose-600">
          {overdueTasks}
        </p>
      </article>
    </section>

    <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Filter size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">
          Фільтри
        </h2>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <label className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук за задачою або проєктом"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as ApiTaskStatus | 'ALL',
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">Усі статуси</option>
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value as ApiTaskPriority | 'ALL',
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">Усі пріоритети</option>
          {Object.entries(priorityLabels).map(
            ([priority, label]) => (
              <option key={priority} value={priority}>
                {label}
              </option>
            ),
          )}
        </select>

        <select
          value={deadlineFilter}
          onChange={(event) =>
            setDeadlineFilter(
              event.target.value as DeadlineFilter,
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">Усі дедлайни</option>
          <option value="OVERDUE">Прострочені</option>
          <option value="TODAY">На сьогодні</option>
          <option value="NEXT_7_DAYS">Наступні 7 днів</option>
          <option value="NO_DUE_DATE">Без дедлайну</option>
        </select>
      </div>
    </section>

    <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={21} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Список завдань
          </h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
          Знайдено: {filteredTasks.length}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">
          Завантаження завдань...
        </p>
      ) : error ? (
        <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <CheckCircle2
            size={26}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 text-sm font-semibold text-slate-600">
            За заданими фільтрами завдань немає
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filteredTasks.map((task) => (
            <article
              key={task.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 lg:flex-row lg:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/projects/${task.project.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {task.title}
                  </Link>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                </div>

                <Link
                  to={`/projects/${task.project.id}`}
                  className="mt-1 block text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {task.project.name}
                </Link>

                {task.project.location && (
                  <p className="mt-1 text-sm text-slate-500">
                    {task.project.location}
                  </p>
                )}

                {task.description && (
                  <p className="mt-2 text-sm text-slate-500">
                    {task.description}
                  </p>
                )}

                <p
                  className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${
                    isOverdue(task.dueDate)
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  <CalendarDays size={14} />
                  {formatDate(task.dueDate)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={task.status}
                  disabled={updatingTaskId === task.id}
                  onChange={(event) =>
                    void handleStatusChange(
                      task,
                      event.target.value as ApiTaskStatus,
                    )
                  }
                  className={`rounded-xl border-0 px-3 py-2 text-sm font-semibold outline-none ${statusClasses[task.status]} disabled:opacity-50`}
                >
                  {Object.entries(statusLabels).map(
                    ([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ),
                  )}
                </select>

                <EditTaskPanel
                task={task}
                onUpdated={loadTasks}
                />
                
                <button
                  type="button"
                  disabled={deletingTaskId === task.id}
                  onClick={() => void handleDelete(task)}
                  title="Видалити завдання"
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
      </div>
    </main>
  )
}