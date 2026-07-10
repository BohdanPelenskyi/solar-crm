import { useState, type FormEvent } from 'react'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useUndoDelete } from './UndoDeleteProvider'
import {
  createProjectEquipment,
  deleteProjectEquipment,
  updateProjectEquipment,
  type ApiEquipmentStatus,
  type ApiProjectEquipment,
} from '../lib/api'

type ProjectEquipmentProps = {
  projectId: number
  equipment: ApiProjectEquipment[]
  onChanged: () => Promise<void> | void
}

type EquipmentForm = {
  name: string
  status: ApiEquipmentStatus
}

const statusLabels: Record<ApiEquipmentStatus, string> = {
  ORDERED: 'Замовлено',
  PAID: 'Оплачено',
  IN_STOCK: 'На складі',
  ON_SITE: 'На обʼєкті',
}

const statusClassNames: Record<ApiEquipmentStatus, string> = {
  ORDERED: 'bg-slate-100 text-slate-700',
  PAID: 'bg-blue-100 text-blue-700',
  IN_STOCK: 'bg-amber-100 text-amber-700',
  ON_SITE: 'bg-emerald-100 text-emerald-700',
}

const initialForm: EquipmentForm = {
  name: '',
  status: 'ORDERED',
}

export function ProjectEquipment({
  projectId,
  equipment,
  onChanged,
}: ProjectEquipmentProps) {
  const { canManage } = useAuth()
  const { scheduleUndoDelete } = useUndoDelete()
  const [isOpen, setIsOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] =
    useState<ApiProjectEquipment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<EquipmentForm>(initialForm)

  function openCreate() {
    setForm(initialForm)
    setEditingEquipment(null)
    setError('')
    setIsOpen(true)
  }

  function openEdit(item: ApiProjectEquipment) {
    setForm({
      name: item.name,
      status: item.status,
    })
    setEditingEquipment(item)
    setError('')
    setIsOpen(true)
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsOpen(false)
    setEditingEquipment(null)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Вкажи назву обладнання')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      if (editingEquipment) {
        await updateProjectEquipment(editingEquipment.id, {
          name: form.name.trim(),
          status: form.status,
        })
      } else {
        await createProjectEquipment(projectId, {
          name: form.name.trim(),
          status: form.status,
        })
      }

      await onChanged()
      setIsOpen(false)
      setEditingEquipment(null)
      setForm(initialForm)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося зберегти обладнання',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleDelete(item: ApiProjectEquipment) {
    setIsDeletingId(item.id)

    scheduleUndoDelete({
      message: `Обладнання «${item.name}» буде видалено`,
      action: async () => {
        await deleteProjectEquipment(item.id)
      },
      onCompleted: async () => {
        await onChanged()
        setIsDeletingId(null)
      },
      onCancel: () => {
        setIsDeletingId(null)
      },
      onError: (requestError) => {
        setIsDeletingId(null)

        window.alert(
          requestError instanceof Error
            ? requestError.message
            : 'Не вдалося видалити обладнання',
        )
      },
    })
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Обладнання
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Обладнання проєкту та його поточний статус
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Додати обладнання
          </button>
        )}
      </div>

      {equipment.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <Package size={24} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Обладнання ще не додано
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {equipment.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">
                  {item.name}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClassNames[item.status]}`}
                >
                  {statusLabels[item.status]}
                </span>
              </div>

              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                    title="Редагувати обладнання"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    disabled={isDeletingId === item.id}
                    onClick={() => void handleDelete(item)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Видалити обладнання"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              {editingEquipment ? 'Редагувати обладнання' : 'Додати обладнання'}
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Назва обладнання
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
                  placeholder="Наприклад: Deye 100kW"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                      status: event.target.value as ApiEquipmentStatus,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
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
                {isSaving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
