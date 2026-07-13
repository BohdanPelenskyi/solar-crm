import { useState, type FormEvent } from 'react'
import {
CalendarDays,
CheckCircle2,
ClipboardList,
Plus,
Trash2,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useUndoDelete } from './UndoDeleteProvider'
import {
createProjectTask,
deleteProjectTask,
updateProjectTask,
type ApiProjectTask,
type ApiTaskPriority,
type ApiTaskStatus,
} from '../lib/api'
import { EditTaskPanel } from './EditTaskPanel'

type ProjectTasksProps = {
projectId: number
tasks: ApiProjectTask[]
onChanged: () => Promise<void> | void
}

type TaskForm = {
title: string
description: string
priority: ApiTaskPriority
dueDate: string
}

const statusLabels: Record<ApiTaskStatus, string> = {
TODO: 'Заплановано',
IN_PROGRESS: 'В роботі',
DONE: 'Виконано',
CANCELED: 'Скасовано',
}

const priorityLabels: Record<ApiTaskPriority, string> = {
LOW: 'Низький',
MEDIUM: 'Середній',
HIGH: 'Високий',
}

const statusClasses: Record<ApiTaskStatus, string> = {
TODO: 'bg-slate-100 text-slate-700',
IN_PROGRESS: 'bg-amber-50 text-amber-700',
DONE: 'bg-emerald-50 text-emerald-700',
CANCELED: 'bg-rose-50 text-rose-700',
}

const priorityClasses: Record<ApiTaskPriority, string> = {
LOW: 'bg-slate-100 text-slate-600',
MEDIUM: 'bg-blue-50 text-blue-700',
HIGH: 'bg-rose-50 text-rose-700',
}

function formatDate(value: string | null) {
if (!value) {
return 'Без дедлайну'
}

return new Intl.DateTimeFormat('uk-UA', {
day: '2-digit',
month: 'short',
year: 'numeric',
}).format(new Date(value))
}

function getInitialForm(): TaskForm {
return {
title: '',
description: '',
priority: 'MEDIUM',
dueDate: '',
}
}

export function ProjectTasks({
projectId,
tasks,
onChanged,
}: ProjectTasksProps) {
const { canAdd, canManage } = useAuth()
const { scheduleUndoDelete } = useUndoDelete()
const [isOpen, setIsOpen] = useState(false)
const [isSaving, setIsSaving] = useState(false)
const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)
const [error, setError] = useState('')
const [form, setForm] = useState<TaskForm>(getInitialForm)

function openModal() {
setForm(getInitialForm())
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

async function handleCreate(event: FormEvent<HTMLFormElement>) {
event.preventDefault()

if (!form.title.trim()) {
  setError('Вкажи назву завдання')
  return
}

try {
  setIsSaving(true)
  setError('')

  await createProjectTask(projectId, {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    priority: form.priority,
    dueDate: form.dueDate
      ? new Date(`${form.dueDate}T12:00:00`).toISOString()
      : undefined,
  })

  await onChanged()
  setIsOpen(false)
} catch (requestError) {
  setError(
    requestError instanceof Error
      ? requestError.message
      : 'Не вдалося створити завдання',
  )
} finally {
  setIsSaving(false)
}

}

async function handleStatusChange(
task: ApiProjectTask,
status: ApiTaskStatus,
) {
try {
setUpdatingTaskId(task.id)

  await updateProjectTask(task.id, { status })
  await onChanged()
} catch (requestError) {
  window.alert(
    requestError instanceof Error
      ? requestError.message
      : 'Не вдалося оновити статус',
  )
} finally {
  setUpdatingTaskId(null)
}

}

function handleDelete(task: ApiProjectTask) {
setDeletingTaskId(task.id)

scheduleUndoDelete({
  message: `Завдання «${task.title}» буде видалено`,
  action: async () => {
    await deleteProjectTask(task.id)
  },
  onCompleted: async () => {
    await onChanged()
    setDeletingTaskId(null)
  },
  onCancel: () => {
    setDeletingTaskId(null)
  },
  onError: (requestError) => {
    setDeletingTaskId(null)

    window.alert(
      requestError instanceof Error
        ? requestError.message
        : 'Не вдалося видалити завдання',
    )
  },
})

}

return (
<>
<section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
<div className="flex flex-wrap items-start justify-between gap-4">
<div>
<div className="flex items-center gap-2">
<ClipboardList size={21} className="text-blue-600" />
<h2 className="text-lg font-bold text-slate-900">
Завдання
</h2>
</div>

      </div>

      {canAdd && (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Додати завдання
        </button>
      )}
    </div>

    {tasks.length === 0 ? (
      <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <CheckCircle2
          size={25}
          className="mx-auto text-slate-400"
        />

        <p className="mt-3 text-sm font-semibold text-slate-600">
          Завдань для цього проєкту ще немає
        </p>
      </div>
    ) : (
      <div className="mt-5 space-y-3">
        {tasks.map((task) => (
          <article
            key={task.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 lg:flex-row lg:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">
                  {task.title}
                </h3>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}
                >
                  {priorityLabels[task.priority]}
                </span>
              </div>

              {task.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {task.description}
                </p>
              )}

              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={14} />
                {formatDate(task.dueDate)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canManage ? (
                <>
                  <select
                    value={task.status}
                    disabled={updatingTaskId === task.id}
                    onChange={(event) =>
                      void handleStatusChange(
                        task,
                        event.target.value as ApiTaskStatus,
                      )
                    }
                    className={`rounded-xl border-0 px-3 py-2 text-sm font-semibold outline-none ${statusClasses[task.status]} disabled:opacity-50`}
                  >
                    {Object.entries(statusLabels).map(
                      ([status, label]) => (
                        <option key={status} value={status}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>

                  <EditTaskPanel
                    task={task}
                    onUpdated={onChanged}
                  />

                  <button
                    type="button"
                    disabled={deletingTaskId === task.id}
                    onClick={() => void handleDelete(task)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Видалити завдання"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : (
                <span
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${statusClasses[task.status]}`}
                >
                  {statusLabels[task.status]}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </section>

  {isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-900">
          Нове завдання
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
              placeholder="Наприклад: Виїхати на замір"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Опис
            </span>

            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Додаткові деталі, матеріали або примітки"
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
            {isSaving ? 'Збереження...' : 'Створити завдання'}
          </button>
        </div>
      </form>
    </div>
  )}
</>
  )
}