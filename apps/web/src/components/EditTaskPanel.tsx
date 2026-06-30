import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import {
  updateProjectTask,
  type ApiProjectTask,
  type ApiTaskPriority,
} from '../lib/api'

type EditTaskPanelProps = {
  task: ApiProjectTask
  onUpdated: () => Promise<void> | void
}

type TaskForm = {
  title: string
  description: string
  priority: ApiTaskPriority
  dueDate: string
}

const priorityLabels: Record<ApiTaskPriority, string> = {
  LOW: 'Низький',
  MEDIUM: 'Середній',
  HIGH: 'Високий',
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function getInitialForm(task: ApiProjectTask): TaskForm {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: toDateInput(task.dueDate),
  }
}

export function EditTaskPanel({
  task,
  onUpdated,
}: EditTaskPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TaskForm>(() =>
    getInitialForm(task),
  )

  function openModal() {
    setForm(getInitialForm(task))
    setError('')
    setIsOpen(true)
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsOpen(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Вкажи назву завдання')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await updateProjectTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        dueDate: form.dueDate
          ? new Date(`${form.dueDate}T12:00:00`).toISOString()
          : null,
      })

      await onUpdated()
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося оновити завдання',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        title="Редагувати завдання"
      >
        <Pencil size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Редагувати завдання
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Назва
                </span>

                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Опис
                </span>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Пріоритет
                  </span>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value as ApiTaskPriority,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {Object.entries(priorityLabels).map(
                      ([priority, label]) => (
                        <option key={priority} value={priority}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Дедлайн
                  </span>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

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