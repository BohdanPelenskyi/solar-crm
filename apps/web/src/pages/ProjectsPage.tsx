import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { projects, statusStyles } from '../data/projects'

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Усі статуси')

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.contactName.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        selectedStatus === 'Усі статуси' ||
        project.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [search, selectedStatus])

  function clearFilters() {
    setSearch('')
    setSelectedStatus('Усі статуси')
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
              Пошук працює по назві проєкту та імені контактної особи
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
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option>Усі статуси</option>
              <option>В роботі</option>
              <option>КП відправлено</option>
              <option>Монтаж</option>
              <option>Завершено</option>
            </select>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Очистити
            </button>
          </div>

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
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-5 font-semibold text-slate-900">
                      {project.name}
                    </td>

                    <td className="px-3 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-3 py-5 text-slate-600">
                      {project.location}
                    </td>

                    <td className="px-3 py-5 text-slate-600">
                      {project.source}
                    </td>

                    <td className="px-3 py-5">
                      <p className="font-semibold text-slate-800">
                        {project.contactName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {project.phone}
                      </p>
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
                ))}
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
        </section>
      </div>
    </main>
  )
}