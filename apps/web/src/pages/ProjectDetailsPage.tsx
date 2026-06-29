import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Upload,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { projects, statusStyles } from '../data/projects'

function MediaCard({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="flex aspect-[1.5] flex-col justify-end rounded-2xl bg-gradient-to-br from-sky-100 via-amber-50 to-slate-100 p-4">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function FinanceRow({
  title,
  subtitle,
  amount,
}: {
  title: string
  subtitle: string
  amount: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <p className="whitespace-nowrap font-semibold text-slate-900">
        {amount}
      </p>
    </div>
  )
}

export function ProjectDetailsPage() {
  const { id } = useParams()
  const project = projects.find((item) => item.id === Number(id))

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Назад до проєктів
          </Link>

          <section className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Проєкт не знайдено
            </h1>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Назад до проєктів
          </Link>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Зберегти зміни
          </button>
        </div>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
                ☀️
              </div>

              <div>
                <p className="text-sm text-slate-500">Назва проєкту</p>

                <div className="mt-1 flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {project.name}
                  </h1>

                  <button className="text-slate-400 transition hover:text-blue-600">
                    <Pencil size={17} />
                  </button>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyles[project.status]}`}
            >
              {project.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-3">
              <WalletCards size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Статус</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.status}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <UserRound size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Джерело</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.source}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Локація</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.location}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarDays size={19} className="mt-0.5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Дата створення</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {project.createdAt}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="space-y-5">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Контакти
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Контактні особи клієнта
                  </p>
                </div>

                <button className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  <Plus size={17} />
                  Додати
                </button>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[580px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Телефон</th>
                      <th className="pb-3">Ім’я</th>
                      <th className="pb-3">Посада</th>
                      <th className="pb-3 text-right">Дії</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <Phone size={16} className="text-blue-600" />
                          {project.phone}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-slate-800">
                        {project.contactName}
                      </td>
                      <td className="py-4 text-slate-600">Власник</td>
                      <td className="py-4 text-right">
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
                          <Pencil size={17} />
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <Phone size={16} className="text-blue-600" />
                          +380 50 987 65 43
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-slate-800">
                        Марія Іваненко
                      </td>
                      <td className="py-4 text-slate-600">Бухгалтер</td>
                      <td className="py-4 text-right">
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
                          <Pencil size={17} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Фото та відео
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Дах, щитова, лічильник, монтаж
                  </p>
                </div>

                <button className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  <Upload size={17} />
                  Додати файли
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MediaCard title="Фото даху" subtitle="18.05.2026" />
                <MediaCard title="Щитова" subtitle="18.05.2026" />
                <MediaCard title="Лічильник" subtitle="18.05.2026" />

                <button className="flex aspect-[1.5] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                  <Plus size={22} />
                  <span className="mt-2">Завантажити</span>
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Фінанси</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Доходи та витрати проєкту
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-emerald-700">Прихід</h3>
                    <button className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <Plus size={16} />
                      Додати
                    </button>
                  </div>

                  <div className="mt-2">
                    <FinanceRow
                      title="Green Hall"
                      subtitle="Переказ · 18.05.2026"
                      amount="120 000 грн"
                    />
                  </div>

                  <div className="mt-3 flex justify-between border-t border-emerald-100 pt-3 font-bold text-slate-900">
                    <span>Разом</span>
                    <span>120 000 грн</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-rose-700">Витрати</h3>
                    <button className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700">
                      <Plus size={16} />
                      Додати
                    </button>
                  </div>

                  <div className="mt-2">
                    <FinanceRow
                      title="Постачальник"
                      subtitle="Готівка · 19.05.2026"
                      amount="58 400 грн"
                    />
                  </div>

                  <div className="mt-3 flex justify-between border-t border-rose-100 pt-3 font-bold text-slate-900">
                    <span>Разом</span>
                    <span>58 400 грн</span>
                  </div>
                </div>
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
                  <span className="font-bold text-emerald-700">120 000 грн</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Витрати</span>
                  <span className="font-bold text-rose-600">58 400 грн</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-semibold text-slate-800">Маржа</span>
                  <span className="font-bold text-slate-900">61 600 грн</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Документи
                </h2>

                <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                  <Upload size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      КП_СЕС_30кВт_final.pdf
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Комерційна пропозиція
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      Проект_електрика.pdf
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Проєктна документація
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}