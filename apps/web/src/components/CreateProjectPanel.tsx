import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  createProject,
  type ApiProjectStatus,
} from '../lib/api'

type CreateProjectPanelProps = {
  onCreated: () => Promise<void> | void
}

const statusLabels: Record<ApiProjectStatus, string> = {
  DRAFT: 'Чернетка',
  PROPOSAL_SENT: 'КП відправлено',
  IN_PROGRESS: 'В роботі',
  INSTALLATION: 'Монтаж',
  COMPLETED: 'Завершено',
  CANCELED: 'Скасовано',
}

export function CreateProjectPanel({
  onCreated,
}: CreateProjectPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    status: 'DRAFT' as ApiProjectStatus,
    source: '',
    location: '',
    notes: '',
  })

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsOpen(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setError('')

      await createProject({
        name: form.name.trim(),
        status: form.status,
        source: form.source.trim() || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })

      await onCreated()

      setForm({
        name: '',
        status: 'DRAFT',
        source: '',
        location: '',
        notes: '',
      })

      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося створити проєкт',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus size={18} />
        Новий проєкт
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Новий проєкт
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Створи картку нового об’єкта для CRM
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Назва проєкту
                </span>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: СЕС 30 кВт — приватний будинок"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Статус
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as ApiProjectStatus,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                >
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Джерело клієнта
                </span>

                <input
                  value={form.source}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      source: event.target.value,
                    }))
                  }
                  placeholder="Instagram, Google, рекомендація..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Локація
                </span>

                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: м. Львів, вул. Зелена"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Нотатки
                </span>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Короткий опис, деталі дзвінка, особливості об’єкта..."
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              {error && (
                <p className="sm:col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Скасувати
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Створення...' : 'Створити проєкт'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}