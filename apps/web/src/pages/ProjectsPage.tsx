import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Plus, Search } from 'lucide-react'
import {
  getProjects,
  type ApiProject,
  type ApiProjectStatus,
} from '../lib/api'

type StatusFilter = 'ALL' | ApiProjectStatus

const statusInfo: Record<
  ApiProjectStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Чернетка',
    className: 'bg-slate-100 text-slate-700',
  },
  PROPOSAL_SENT: {
    label: 'КП відправлено',
    className: 'bg-sky-100 text-sky-700',
  },
  IN_PROGRESS: {
    label: 'В роботі',
    className: 'bg-emerald-100 text-emerald-700',
  },
  INSTALLATION: {
    label: 'Монтаж',
    className: 'bg-amber-100 text-amber-700',
  },
  COMPLETED: {
    label: 'Завершено',
    className: 'bg-violet-100 text-violet-700',
  },
  CANCELED: {
    label: 'Скасовано',
    className: 'bg-rose-100 text-rose-700',
  },
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilter>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProjects() {
    try {
      setIsLoading(true)
      setError('')

      const data = await getProjects()
      setProjects(data)
    } catch {
      setError(
        'Не вдалося підключитися до API. Перевір, чи запущений Nest-сервер.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return projects.filter((project) => {
      const primaryContact = project.contacts[0]

      const matchesSearch =
        project.name.toLowerCase().includes(normalizedSearch) ||
        primaryContact?.fullName.toLowerCase().includes(normalizedSearch) ||
        primaryContact?.phone.includes(normalizedSearch)

      const matchesStatus =
        selectedStatus === 'ALL' || project.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [projects, search, selectedStatus])

  function clearFilters() {
    setSearch('')
    setSelectedStatus('ALL')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-slate-500">CRM / Проєкти</p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Список проєктів
          </h1>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            <Plus size={18} />
            Новий проєкт
          </button>
        </div>

        <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Усі проєкти
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Дані завантажуються з бази PostgreSQL
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={19} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Пошук: назва проєкту або ім'я контакту..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as StatusFilter)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">Усі статуси</option>
              <option value="DRAFT">Чернетка</option>
              <option value="PROPOSAL_SENT">КП відправлено</option>
              <option value="IN_PROGRESS">В роботі</option>
              <option value="INSTALLATION">Монтаж</option>
              <option value="COMPLETED">Завершено</option>
              <option value="CANCELED">Скасовано</option>
            </select>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Очистити
            </button>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-sm font-medium text-slate-500">
              Завантаження проєктів...
            </div>
          )}

          {!isLoading && error && (
            <div className="py-12 text-center">
              <p className="font-semibold text-rose-600">{error}</p>

              <button
                onClick={() => void loadProjects()}
                className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Спробувати ще раз
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-4">Назва проєкту</th>
                      <th className="px-3 py-4">Статус</th>
                      <th className="px-3 py-4">Локація</th>
                      <th className="px-3 py-4">Джерело</th>
                      <th className="px-3 py-4">Основний контакт</th>
                      <th className="px-3 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map((project) => {
                      const primaryContact = project.contacts[0]
                      const status = statusInfo[project.status]

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                        >
                          <td className="px-3 py-5 font-semibold text-slate-900">
                            {project.name}
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="px-3 py-5 text-slate-600">
                            {project.location || '—'}
                          </td>

                          <td className="px-3 py-5 text-slate-600">
                            {project.source || '—'}
                          </td>

                          <td className="px-3 py-5">
                            {primaryContact ? (
                              <>
                                <p className="font-semibold text-slate-800">
                                  {primaryContact.fullName}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {primaryContact.phone}
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-400">Не вказано</p>
                            )}
                          </td>

                          <td className="px-3 py-5 text-right">
                            <Link
                              to={`/projects/${project.id}`}
                              className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              Відкрити
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredProjects.length === 0 && (
                <div className="py-12 text-center">
                  <p className="font-semibold text-slate-700">
                    Проєктів не знайдено
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Спробуй змінити пошук або очистити фільтри.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}