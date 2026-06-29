import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  MapPin,
  Phone,
  Upload,
  UserRound,
  WalletCards,
} from 'lucide-react'
import {
  getProject,
  type ApiContactRole,
  type ApiFileCategory,
  type ApiProjectDetails,
  type ApiProjectStatus,
  type ApiTransactionType,
} from '../lib/api'
import { CreateContactPanel } from '../components/CreateContactPanel'
import { CreateTransactionPanel } from '../components/CreateTransactionPanel'

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

const contactRoleLabels: Record<ApiContactRole, string> = {
  OWNER: 'Власник',
  ACCOUNTANT: 'Бухгалтер',
  ELECTRICIAN: 'Електрик',
  MANAGER: 'Менеджер',
  OTHER: 'Інше',
}

const fileCategoryLabels: Record<ApiFileCategory, string> = {
  PROPOSAL: 'Комерційна пропозиція',
  PROJECT_DOCUMENT: 'Проєктна документація',
  FINANCIAL_DOCUMENT: 'Фінансовий документ',
  OTHER: 'Інший документ',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMoney(value: string | number) {
  const amount = Number(value)

  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function FinanceBlock({
  title,
  type,
  items,
  projectId,
  onCreated,
}: {
  title: string
  type: ApiTransactionType
  items: ApiProjectDetails['transactions']
  projectId: number
  onCreated: () => Promise<void> | void
}) {
  const total = items.reduce((sum, transaction) => {
    return sum + Number(transaction.amount)
  }, 0)

  const isIncome = type === 'INCOME'

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isIncome
          ? 'border-emerald-100 bg-emerald-50/40'
          : 'border-rose-100 bg-rose-50/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
  <h3
    className={`font-bold ${
      isIncome ? 'text-emerald-700' : 'text-rose-700'
    }`}
  >
    {title}
  </h3>

  <CreateTransactionPanel
    projectId={projectId}
    type={type}
    onCreated={onCreated}
  />
</div>

      <div className="mt-3">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            Операцій поки немає.
          </p>
        ) : (
          items.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {transaction.counterparty || 'Не вказано'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(transaction.occurredAt)}
                  {transaction.comment ? ` · ${transaction.comment}` : ''}
                </p>
              </div>

              <p className="whitespace-nowrap font-semibold text-slate-900">
                {formatMoney(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
        <span>Разом</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  )
}

export function ProjectDetailsPage() {
  const { id } = useParams()
  const projectId = Number(id)

  const [project, setProject] = useState<ApiProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProject() {
      if (!Number.isInteger(projectId) || projectId <= 0) {
        setError('Некоректний ID проєкту')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')

        const data = await getProject(projectId)
        setProject(data)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не вдалося завантажити проєкт',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadProject()
  }, [projectId])

  const incomeTransactions = useMemo(
    () =>
      project?.transactions.filter(
        (transaction) => transaction.type === 'INCOME',
      ) ?? [],
    [project],
  )

  const expenseTransactions = useMemo(
    () =>
      project?.transactions.filter(
        (transaction) => transaction.type === 'EXPENSE',
      ) ?? [],
    [project],
  )

  const incomeTotal = incomeTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  )

  const expenseTotal = expenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  )

  const margin = incomeTotal - expenseTotal

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Завантаження проєкту...
        </div>
      </main>
    )
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Назад до проєктів
          </Link>

          <section className="mt-5 rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {error || 'Проєкт не знайдено'}
            </h1>

            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              До списку проєктів
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const status = statusInfo[project.status]

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Назад до проєктів
        </Link>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
                ☀️
              </div>

              <div>
                <p className="text-sm text-slate-500">Назва проєкту</p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-3">
              <WalletCards size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Статус</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {status.label}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <UserRound size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Джерело</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.source || 'Не вказано'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Локація</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.location || 'Не вказано'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarDays size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Дата створення</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {project.notes && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Нотатки
              </p>
              <p className="mt-2 text-sm text-slate-700">{project.notes}</p>
            </div>
          )}
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="space-y-5">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
             <div>
                <h2 className="text-lg font-bold text-slate-900">Контакти</h2>
    <p className="mt-1 text-sm text-slate-500">
      Контактні особи клієнта
    </p>
  </div>

  <CreateContactPanel
    projectId={project.id}
    onCreated={async () => {
      const refreshedProject = await getProject(project.id)
      setProject(refreshedProject)
    }}
  />
</div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[580px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Телефон</th>
                      <th className="pb-3">Ім’я</th>
                      <th className="pb-3">Посада</th>
                      <th className="pb-3">Основний</th>
                    </tr>
                  </thead>

                  <tbody>
                    {project.contacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-sm text-slate-500"
                        >
                          Контакти ще не додані.
                        </td>
                      </tr>
                    ) : (
                      project.contacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-4">
                            <span className="inline-flex items-center gap-2 text-slate-700">
                              <Phone size={16} className="text-blue-600" />
                              {contact.phone}
                            </span>
                          </td>

                          <td className="py-4 font-semibold text-slate-800">
                            {contact.fullName}
                          </td>

                          <td className="py-4 text-slate-600">
                            {contact.position ||
                              contactRoleLabels[contact.role]}
                          </td>

                          <td className="py-4">
                            {contact.isPrimary ? (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                Так
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Фото та відео
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Матеріали з об’єкта
                </p>
              </div>

              {project.media.length === 0 ? (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <Upload size={24} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Файли ще не завантажені
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {project.media.map((media) => (
                    <div
                      key={media.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-semibold text-blue-700">
                        {media.type === 'PHOTO' ? 'Фото' : 'Відео'}
                      </p>
                      <p className="mt-2 truncate font-semibold text-slate-800">
                        {media.originalName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(media.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Фінанси</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Доходи та витрати проєкту
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <FinanceBlock
  title="Прихід"
  type="INCOME"
  items={incomeTransactions}
  projectId={project.id}
  onCreated={async () => {
    const refreshedProject = await getProject(project.id)
    setProject(refreshedProject)
  }}
/>

                <FinanceBlock
  title="Витрати"
  type="EXPENSE"
  items={expenseTransactions}
  projectId={project.id}
  onCreated={async () => {
    const refreshedProject = await getProject(project.id)
    setProject(refreshedProject)
  }}
/>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Швидкий підсумок
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Прихід</span>
                  <span className="font-bold text-emerald-700">
                    {formatMoney(incomeTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Витрати</span>
                  <span className="font-bold text-rose-600">
                    {formatMoney(expenseTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-semibold text-slate-800">Маржа</span>
                  <span className="font-bold text-slate-900">
                    {formatMoney(margin)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Документи</h2>

              {project.files.length === 0 ? (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Документи ще не завантажені.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {project.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
                    >
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <FileText size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {file.originalName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {fileCategoryLabels[file.category]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}