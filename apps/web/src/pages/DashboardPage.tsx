import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CircleAlert,
} from 'lucide-react'
import {
  getDashboardOverview,
  type ApiDashboardOverview,
  type ApiTaskPriority,
  type ApiTaskStatus,
} from '../lib/api'

const taskStatusLabels: Record<ApiTaskStatus, string> = {
  TODO: 'Заплановано',
  IN_PROGRESS: 'В роботі',
  DONE: 'Виконано',
  CANCELED: 'Скасовано',
}

const taskPriorityLabels: Record<ApiTaskPriority, string> = {
  LOW: 'Низький',
  MEDIUM: 'Середній',
  HIGH: 'Високий',
}

const taskPriorityClasses: Record<ApiTaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-rose-50 text-rose-700',
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(amount)
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

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)

  return date
}

function isOverdue(value: string | null) {
  if (!value) {
    return false
  }

  return startOfDay(new Date(value)) < startOfDay(new Date())
}

function isToday(value: string | null) {
  if (!value) {
    return false
  }

  return (
    startOfDay(new Date(value)).getTime() ===
    startOfDay(new Date()).getTime()
  )
}

type MetricCardProps = {
  title: string
  value: string
  description: string
  icon: ReactNode
  iconClassName: string
  className?: string
}

function MetricCard({
  title,
  value,
  description,
  icon,
  iconClassName,
  className = '',
}: MetricCardProps) {
  return (
    <article
      className={`rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 break-words text-lg font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </article>
  )
}

export function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<ApiDashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    try {
      setIsLoading(true)
      setError('')

      const data = await getDashboardOverview()
      setDashboard(data)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося завантажити дашборд',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 pb-24 sm:p-7 md:pb-7">
        <div className="mx-auto max-w-7xl text-sm text-slate-500">
          Завантаження дашборду...
        </div>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 pb-24 sm:p-7 md:pb-7">
        <div className="mx-auto max-w-7xl rounded-2xl bg-rose-50 p-5 text-rose-700">
          <p className="font-semibold">
            {error || 'Помилка завантаження'}
          </p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-3 min-h-11 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold hover:bg-rose-100"
          >
            Спробувати ще раз
          </button>
        </div>
      </main>
    )
  }

  const { metrics, upcomingTasks } = dashboard

  const attentionTasks = upcomingTasks.filter(
    (task) => isOverdue(task.dueDate) || isToday(task.dueDate),
  )

  const overdueAttentionTasks = attentionTasks.filter((task) =>
    isOverdue(task.dueDate),
  )

  const todayAttentionTasks = attentionTasks.filter((task) =>
    isToday(task.dueDate),
  )

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-7">
      <div className="mx-auto max-w-7xl p-4 sm:p-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Дашборд
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Загальна картина по проєктах, фінансах і завданнях
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Оновити
            </button>

            <Link
              to="/projects"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Проєкти
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          <MetricCard
            title="Активні проєкти"
            value={`${metrics.activeProjects} / ${metrics.totalProjects}`}
            description="у роботі зараз"
            icon={<ClipboardList size={20} />}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <MetricCard
            title="Завдання"
            value={String(metrics.pendingTasks)}
            description="потребують виконання"
            icon={<CheckCircle2 size={20} />}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <MetricCard
            title="Прихід"
            value={formatMoney(metrics.income)}
            description="за всіма проєктами"
            icon={<TrendingUp size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            title="Витрати"
            value={formatMoney(metrics.expenses)}
            description="за всіма проєктами"
            icon={<TrendingDown size={20} />}
            iconClassName="bg-rose-50 text-rose-600"
          />

          <MetricCard
            title="Маржа"
            value={formatMoney(metrics.margin)}
            description="прихід мінус витрати"
            icon={<TrendingUp size={20} />}
            iconClassName="bg-violet-50 text-violet-600"
            className="col-span-2 sm:col-span-1"
          />
        </section>

        <section className="mt-5 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:mt-7 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CircleAlert size={21} className="text-amber-500" />

                <h2 className="text-lg font-bold text-slate-900">
                  Потрібна увага
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Прострочені та заплановані на сьогодні завдання
              </p>
            </div>

            <Link
              to="/tasks"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 sm:w-auto"
            >
              Усі завдання
              <ArrowRight size={16} />
            </Link>
          </div>

          {attentionTasks.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              На сьогодні критичних завдань немає.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {attentionTasks.map((task) => {
                const overdue = isOverdue(task.dueDate)

                return (
                  <Link
                    key={task.id}
                    to={`/projects/${task.project.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {task.title}
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-500">
                        {task.project.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          overdue
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {overdue ? 'Прострочено' : 'Сьогодні'}
                      </span>

                      <span
                        className={`text-sm font-semibold ${
                          overdue ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {(overdueAttentionTasks.length > 0 ||
            todayAttentionTasks.length > 0) && (
            <p className="mt-4 text-xs font-semibold text-slate-500">
              Прострочено: {overdueAttentionTasks.length} · На сьогодні:{' '}
              {todayAttentionTasks.length}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:mt-7 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={21} className="text-blue-600" />

                <h2 className="text-lg font-bold text-slate-900">
                  Найближчі завдання
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Заплановані та активні завдання з дедлайном
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {upcomingTasks.length} у списку
            </span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <CheckCircle2
                size={26}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Найближчих завдань із дедлайном немає
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {upcomingTasks.map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/projects/${task.project.id}`}
                        className="break-words font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {task.title}
                      </Link>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${taskPriorityClasses[task.priority]}`}
                      >
                        {taskPriorityLabels[task.priority]}
                      </span>
                    </div>

                    <p className="mt-1 break-words text-sm text-slate-500">
                      {task.project.name}
                      {task.project.location
                        ? ` · ${task.project.location}`
                        : ''}
                    </p>

                    {task.description && (
                      <p className="mt-1 break-words text-sm text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {taskStatusLabels[task.status]}
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        isOverdue(task.dueDate)
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {formatDate(task.dueDate)}
                    </span>
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