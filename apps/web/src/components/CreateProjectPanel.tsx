import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  createProject,
  type ApiContactRole,
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

const contactRoleLabels: Record<ApiContactRole, string> = {
  OWNER: 'Власник',
  ACCOUNTANT: 'Бухгалтер',
  ELECTRICIAN: 'Електрик',
  MANAGER: 'Менеджер',
  OTHER: 'Інше',
}

const initialForm = {
  name: '',
  status: 'DRAFT' as ApiProjectStatus,
  source: '',
  location: '',
  contactFullName: '',
  contactPhone: '',
  contactRole: 'OWNER' as ApiContactRole,
  contactPosition: '',
}

export function CreateProjectPanel({
  onCreated,
}: CreateProjectPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

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
        contactFullName: form.contactFullName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactRole: form.contactRole,
        contactPosition: form.contactPosition.trim() || undefined,
      })

      await onCreated()

      setForm(initialForm)
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
                Створи картку нового об’єкта та основний контакт клієнта
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

              <div className="sm:col-span-2 border-t border-slate-100 pt-5">
                <h3 className="font-bold text-slate-900">
                  Основний контакт
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Контакт автоматично буде доданий у блок «Контакти».
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  ПІБ контакту
                </span>

                <input
                  required
                  value={form.contactFullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactFullName: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: Іван Петренко"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Телефон
                </span>

                <input
                  required
                  type="tel"
                  value={form.contactPhone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactPhone: event.target.value,
                    }))
                  }
                  placeholder="+380..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Роль контакту
                </span>

                <select
                  value={form.contactRole}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactRole: event.target.value as ApiContactRole,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                >
                  {Object.entries(contactRoleLabels).map(
                    ([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Посада
                </span>

                <input
                  value={form.contactPosition}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactPosition: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: директор"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
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