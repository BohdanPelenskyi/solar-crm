import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MapPin, Phone, Search, UserRound } from 'lucide-react'
import {
  getProjects,
  type ApiProject,
  type ApiProjectStatus,
} from '../lib/api'
import { CreateProjectPanel } from '../components/CreateProjectPanel'
import {
  PROJECT_STATUS_INFO,
  PROJECT_STATUS_OPTIONS,
} from '../constants/projectStatuses'

type StatusFilter = 'ALL' | ApiProjectStatus

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getResponsible(project: ApiProject) {
  return [project.responsiblePrimary, project.responsibleSecondary]
    .filter(Boolean)
    .join(', ')
}


function getPhoneHref(phone: string) {
  const cleaned = phone.replace(/[^+\d]/g, '')

  if (!cleaned) {
    return '#'
  }

  if (cleaned.startsWith('+')) {
    return `tel:${cleaned}`
  }

  if (cleaned.startsWith('380')) {
    return `tel:+${cleaned}`
  }

  if (cleaned.startsWith('0')) {
    return `tel:+38${cleaned}`
  }

  return `tel:${cleaned}`
}

function getUniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((first, second) => first.localeCompare(second, 'uk'))
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilter>('ALL')
  const [selectedSource, setSelectedSource] = useState('ALL')
  const [selectedResponsible, setSelectedResponsible] = useState('ALL')
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

  const sourceOptions = useMemo(
    () => getUniqueOptions(projects.map((project) => project.source)),
    [projects],
  )

  const responsibleOptions = useMemo(
    () =>
      getUniqueOptions(
        projects.flatMap((project) => [
          project.responsiblePrimary,
          project.responsibleSecondary,
        ]),
      ),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return projects.filter((project) => {
      const primaryContact = project.contacts[0]
      const responsible = getResponsible(project)

      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        primaryContact?.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        primaryContact?.phone.includes(normalizedSearch) ||
        project.location?.toLowerCase().includes(normalizedSearch) ||
        project.source?.toLowerCase().includes(normalizedSearch) ||
        responsible.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        selectedStatus === 'ALL' || project.status === selectedStatus

      const matchesSource =
        selectedSource === 'ALL' || project.source === selectedSource

      const matchesResponsible =
        selectedResponsible === 'ALL' ||
        project.responsiblePrimary === selectedResponsible ||
        project.responsibleSecondary === selectedResponsible

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesResponsible
      )
    })
  }, [
    projects,
    search,
    selectedResponsible,
    selectedSource,
    selectedStatus,
  ])

  function clearFilters() {
    setSearch('')
    setSelectedStatus('ALL')
    setSelectedSource('ALL')
    setSelectedResponsible('ALL')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 pb-24 sm:px-8 sm:py-7 md:pb-7">
      <div className="mx-auto max-w-7xl">
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Список проєктів
          </h1>

          <CreateProjectPanel
            onCreated={async () => {
              await loadProjects()
            }}
          />
        </div>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm sm:mt-7 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Усі проєкти
              </h2>

            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              Знайдено: {filteredProjects.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[1.7fr_1fr_1fr_1fr_auto]">
            <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={19} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Проєкт, контакт, локація, джерело..."
                className="min-h-6 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
              />
            </label>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as StatusFilter)
              }
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 outline-none focus:border-blue-500 sm:text-sm"
            >
              <option value="ALL">Усі статуси</option>
              {PROJECT_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(event) => setSelectedSource(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 outline-none focus:border-blue-500 sm:text-sm"
            >
              <option value="ALL">Усі джерела</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <select
              value={selectedResponsible}
              onChange={(event) =>
                setSelectedResponsible(event.target.value)
              }
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 outline-none focus:border-blue-500 sm:text-sm"
            >
              <option value="ALL">Усі відповідальні</option>
              {responsibleOptions.map((responsible) => (
                <option key={responsible} value={responsible}>
                  {responsible}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                type="button"
                onClick={() => void loadProjects()}
                className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Спробувати ще раз
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mt-5 space-y-3 md:hidden">
                {filteredProjects.map((project) => {
                  const primaryContact = project.contacts[0]
                  const status = PROJECT_STATUS_INFO[project.status]
                  const summary = project.financialSummary
                  const responsible = getResponsible(project)

                  return (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-slate-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-bold text-slate-900">
                            {project.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {project.source
                              ? `Джерело: ${project.source}`
                              : 'Джерело не вказано'}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p className="flex items-start gap-2 text-slate-600">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />
                          <span>{project.location || 'Локацію не вказано'}</span>
                        </p>

                        <p className="flex items-start gap-2 text-slate-600">
                          <UserRound
                            size={16}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />
                          <span>
                            {responsible || 'Відповідального не вказано'}
                          </span>
                        </p>

                        {primaryContact ? (
                          <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2">
                            <p className="break-words text-sm font-medium text-slate-700">
                              {primaryContact.fullName}
                            </p>

                            <a
                              href={getPhoneHref(primaryContact.phone)}
                              className="mt-1 inline-flex max-w-full items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 transition active:text-blue-900"
                            >
                              <Phone size={15} className="shrink-0" />
                              <span className="break-all">
                                {primaryContact.phone}
                              </span>
                            </a>
                          </div>
                        ) : (
                          <p className="text-slate-600">Контакт не вказано</p>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Прихід
                          </p>
                          <p className="mt-1 font-bold text-emerald-700">
                            {formatMoney(summary.income)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Витрати
                          </p>
                          <p className="mt-1 font-bold text-rose-700">
                            {formatMoney(summary.expenses)}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/projects/${project.id}`}
                        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition active:bg-blue-50"
                      >
                        Відкрити проєкт
                      </Link>
                    </article>
                  )
                })}
              </div>

              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1180px] border-collapse">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-4">Назва проєкту</th>
                      <th className="px-3 py-4">Статус</th>
                      <th className="px-3 py-4">Джерело</th>
                      <th className="px-3 py-4">Відповідальний</th>
                      <th className="px-3 py-4">Локація</th>
                      <th className="px-3 py-4">Контакт</th>
                      <th className="px-3 py-4 text-right">Прихід</th>
                      <th className="px-3 py-4 text-right">Витрати</th>
                      <th className="px-3 py-4 text-right" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map((project) => {
                      const primaryContact = project.contacts[0]
                      const status = PROJECT_STATUS_INFO[project.status]
                      const summary = project.financialSummary
                      const responsible = getResponsible(project)

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                        >
                          <td className="px-3 py-5">
                            <p className="max-w-[240px] break-words font-semibold text-slate-900">
                              {project.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {summary.transactionsCount === 0
                                ? 'Фінансових операцій немає'
                                : `Операцій: ${summary.transactionsCount}`}
                            </p>
                          </td>

                          <td className="px-3 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="px-3 py-5 text-slate-600">
                            {project.source || '—'}
                          </td>

                          <td className="px-3 py-5 text-slate-600">
                            {responsible || '—'}
                          </td>

                          <td className="px-3 py-5 text-slate-600">
                            {project.location || '—'}
                          </td>

                          <td className="px-3 py-5">
                            {primaryContact ? (
                              <>
                                <p className="font-semibold text-slate-800">
                                  {primaryContact.fullName}
                                </p>

                                <a
                                  href={getPhoneHref(primaryContact.phone)}
                                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                  <Phone size={13} className="shrink-0" />
                                  {primaryContact.phone}
                                </a>
                              </>
                            ) : (
                              <p className="text-slate-400">Не вказано</p>
                            )}
                          </td>

                          <td className="px-3 py-5 text-right font-semibold text-emerald-700">
                            {formatMoney(summary.income)}
                          </td>

                          <td className="px-3 py-5 text-right font-semibold text-rose-700">
                            {formatMoney(summary.expenses)}
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
