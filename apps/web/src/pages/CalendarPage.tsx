import {
  CalendarDays,
  Clock,
} from 'lucide-react'

export function CalendarPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-7">
      <div className="mx-auto max-w-7xl p-4 sm:p-7">
        <header>
          <p className="text-sm font-semibold text-blue-600">
            Leo Energy CRM
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Календар
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Розділ для планування робіт, дедлайнів і подій.
          </p>
        </header>

        <section className="mt-6 flex min-h-[55vh] items-center justify-center rounded-3xl bg-white p-6 text-center shadow-sm sm:mt-8">
          <div className="max-w-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <CalendarDays size={38} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
              Календар в розробці
            </h2>

            <p className="mt-3 text-base leading-7 text-slate-500">
              Ми готуємо зручний календар для планування монтажів,
              зустрічей, дедлайнів і внутрішніх завдань по проєктах.
            </p>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              <Clock size={17} />
              Розділ буде доступний у наступних оновленнях
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}