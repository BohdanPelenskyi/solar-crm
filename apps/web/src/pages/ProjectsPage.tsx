import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowDownUp, Search } from 'lucide-react'
import {
getProjects,
type ApiProject,
type ApiProjectStatus,
} from '../lib/api'
import { CreateProjectPanel } from '../components/CreateProjectPanel'

type StatusFilter = 'ALL' | ApiProjectStatus

type FinancialFilter =
| 'ALL'
| 'PROFITABLE'
| 'LOSS'
| 'NO_TRANSACTIONS'

type ProjectSort =
| 'UPDATED_DESC'
| 'NAME_ASC'
| 'INCOME_DESC'
| 'EXPENSES_DESC'
| 'MARGIN_DESC'
| 'MARGIN_ASC'

const statusInfo: Record<
ApiProjectStatus,
{ label: string; className: string }> = {
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

function formatMoney(amount: number) {
return new Intl.NumberFormat('uk-UA', {
style: 'currency',
currency: 'UAH',
maximumFractionDigits: 0,
}).format(amount)
}

export function ProjectsPage() {
const [projects, setProjects] = useState<ApiProject[]>([])
const [search, setSearch] = useState('')
const [selectedStatus, setSelectedStatus] =
useState<StatusFilter>('ALL')
const [selectedFinancialFilter, setSelectedFinancialFilter] =
useState<FinancialFilter>('ALL')
const [selectedSort, setSelectedSort] =
useState<ProjectSort>('UPDATED_DESC')
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


const result = projects.filter((project) => {
  const primaryContact = project.contacts[0]
  const summary = project.financialSummary

  const matchesSearch =
    !normalizedSearch ||
    project.name.toLowerCase().includes(normalizedSearch) ||
    primaryContact?.fullName
      .toLowerCase()
      .includes(normalizedSearch) ||
    primaryContact?.phone.includes(normalizedSearch) ||
    project.location?.toLowerCase().includes(normalizedSearch)

  const matchesStatus =
    selectedStatus === 'ALL' || project.status === selectedStatus

  const matchesFinancialFilter =
    selectedFinancialFilter === 'ALL' ||
    (selectedFinancialFilter === 'PROFITABLE' &&
      summary.transactionsCount > 0 &&
      summary.margin > 0) ||
    (selectedFinancialFilter === 'LOSS' &&
      summary.transactionsCount > 0 &&
      summary.margin < 0) ||
    (selectedFinancialFilter === 'NO_TRANSACTIONS' &&
      summary.transactionsCount === 0)

  return (
    matchesSearch &&
    matchesStatus &&
    matchesFinancialFilter
  )
})

return [...result].sort((first, second) => {
  switch (selectedSort) {
    case 'NAME_ASC':
      return first.name.localeCompare(second.name, 'uk')

    case 'INCOME_DESC':
      return (
        second.financialSummary.income -
        first.financialSummary.income
      )

    case 'EXPENSES_DESC':
      return (
        second.financialSummary.expenses -
        first.financialSummary.expenses
      )

    case 'MARGIN_DESC':
      return (
        second.financialSummary.margin -
        first.financialSummary.margin
      )

    case 'MARGIN_ASC':
      return (
        first.financialSummary.margin -
        second.financialSummary.margin
      )

    case 'UPDATED_DESC':
    default:
      return (
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
      )
  }
})


}, [
projects,
search,
selectedFinancialFilter,
selectedSort,
selectedStatus,
])

function clearFilters() {
setSearch('')
setSelectedStatus('ALL')
setSelectedFinancialFilter('ALL')
setSelectedSort('UPDATED_DESC')
}

return ( <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8"> <div className="mx-auto max-w-7xl"> <p className="text-sm text-slate-500">CRM / Проєкти</p>


    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Список проєктів
      </h1>

      <CreateProjectPanel
        onCreated={async () => {
          await loadProjects()
        }}
      />
    </div>

    <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Усі проєкти
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Фінанси та статуси по всіх об’єктах
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
          Знайдено: {filteredProjects.length}
        </span>
      </div>

      

      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 lg:col-span-2">
          <Search size={19} className="shrink-0 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: проєкт, контакт або локація..."
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

        <select
          value={selectedFinancialFilter}
          onChange={(event) =>
            setSelectedFinancialFilter(
              event.target.value as FinancialFilter,
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">Усі фінансові результати</option>
          <option value="PROFITABLE">Прибуткові</option>
          <option value="LOSS">Зі збитком</option>
          <option value="NO_TRANSACTIONS">
            Без фінансових операцій
          </option>
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <ArrowDownUp size={18} className="text-slate-400" />

          <select
            value={selectedSort}
            onChange={(event) =>
              setSelectedSort(event.target.value as ProjectSort)
            }
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
          >
            <option value="UPDATED_DESC">
              Спочатку оновлені нещодавно
            </option>
            <option value="NAME_ASC">За назвою А–Я</option>
            <option value="INCOME_DESC">За приходом: найбільший</option>
            <option value="EXPENSES_DESC">
              За витратами: найбільші
            </option>
            <option value="MARGIN_DESC">За маржею: найбільша</option>
            <option value="MARGIN_ASC">За маржею: найменша</option>
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Очистити фільтри
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
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-4">Назва проєкту</th>
                  <th className="px-3 py-4">Статус</th>
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
                  const status = statusInfo[project.status]
                  const summary = project.financialSummary

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                    >
                      <td className="px-3 py-5">
                        <p className="font-semibold text-slate-900">
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
                        {project.location || '—'}
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
