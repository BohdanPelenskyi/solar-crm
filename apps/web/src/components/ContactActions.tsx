import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useUndoDelete } from './UndoDeleteProvider'
import {
  deleteProjectContact,
  updateProjectContact,
  type ApiContactRole,
  type ApiProjectContact,
} from '../lib/api'

type ContactActionsProps = {
  contact: ApiProjectContact
  onChanged: () => Promise<void> | void
}

const roleLabels: Record<ApiContactRole, string> = {
  OWNER: 'Власник',
  ACCOUNTANT: 'Бухгалтер',
  ELECTRICIAN: 'Електрик',
  MANAGER: 'Менеджер',
  OTHER: 'Інше',
}

export function ContactActions({
  contact,
  onChanged,
}: ContactActionsProps) {
  const { canManage } = useAuth()
  const { scheduleUndoDelete } = useUndoDelete()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: contact.fullName,
    phone: contact.phone,
    role: contact.role,
    position: contact.position ?? '',
    isPrimary: contact.isPrimary,
  })

  if (!canManage) {
    return null
  }

  function openEdit() {
    setForm({
      fullName: contact.fullName,
      phone: contact.phone,
      role: contact.role,
      position: contact.position ?? '',
      isPrimary: contact.isPrimary,
    })

    setError('')
    setIsEditing(true)
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsEditing(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.fullName.trim()) {
      setError('Вкажи ПІБ контакту')
      return
    }

    if (!form.phone.trim()) {
      setError('Вкажи номер телефону')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await updateProjectContact(contact.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        role: form.role,
        position: form.position.trim() || undefined,
        isPrimary: form.isPrimary,
      })

      await onChanged()
      setIsEditing(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося оновити контакт',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleDelete() {
    setIsDeleting(true)

    scheduleUndoDelete({
      message: `Контакт «${contact.fullName}» буде видалено`,
      action: async () => {
        await deleteProjectContact(contact.id)
      },
      onCompleted: async () => {
        await onChanged()
        setIsDeleting(false)
      },
      onCancel: () => {
        setIsDeleting(false)
      },
      onError: (requestError) => {
        setIsDeleting(false)

        window.alert(
          requestError instanceof Error
            ? requestError.message
            : 'Не вдалося видалити контакт',
        )
      },
    })
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          onClick={openEdit}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
          title="Редагувати контакт"
        >
          <Pencil size={16} />
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          title="Видалити контакт"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Редагувати контакт
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  ПІБ
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid gap-4">
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
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Скасувати
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
