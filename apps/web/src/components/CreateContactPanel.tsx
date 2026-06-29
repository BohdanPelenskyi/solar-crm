import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  createProjectContact,
  type ApiContactRole,
} from '../lib/api'

type CreateContactPanelProps = {
  projectId: number
  onCreated: () => Promise<void> | void
}

const roleLabels: Record<ApiContactRole, string> = {
  OWNER: 'Власник',
  ACCOUNTANT: 'Бухгалтер',
  ELECTRICIAN: 'Електрик',
  MANAGER: 'Менеджер',
  OTHER: 'Інше',
}

export function CreateContactPanel({
  projectId,
  onCreated,
}: CreateContactPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    role: 'OWNER' as ApiContactRole,
    position: '',
    isPrimary: true,
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

      await createProjectContact(projectId, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        role: form.role,
        position: form.position.trim() || undefined,
        isPrimary: form.isPrimary,
      })

      await onCreated()

      setForm({
        fullName: '',
        phone: '',
        role: 'OWNER',
        position: '',
        isPrimary: true,
      })

      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося додати контакт',
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
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
      >
        <Plus size={17} />
        Додати контакт
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Новий контакт
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Контактна особа клієнта для цього проєкту
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Ім’я та прізвище
                </span>

                <input
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: Василь Петренко"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Телефон
                </span>

                <input
                  required
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+380 96 012 26 20"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Роль
                  </span>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value as ApiContactRole,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Посада
                  </span>

                  <input
                    value={form.position}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        position: event.target.value,
                      }))
                    }
                    placeholder="Наприклад: директор"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPrimary: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-slate-700">
                  Основний контакт проєкту
                </span>
              </label>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
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
                {isSaving ? 'Збереження...' : 'Зберегти контакт'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}