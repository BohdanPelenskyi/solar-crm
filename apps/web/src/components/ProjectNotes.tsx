import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  Pencil,
  Plus,
  StickyNote,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { updateProject } from '../lib/api'

type ProjectNotesProps = {
  projectId: number
  initialNotes: string | null
  onUpdated: () => Promise<void> | void
}

export function ProjectNotes({
  projectId,
  initialNotes,
  onUpdated,
}: ProjectNotesProps) {
  const { canManage } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNotes(initialNotes ?? '')
  }, [initialNotes])

  function cancelEditing() {
    if (isSaving) {
      return
    }

    setNotes(initialNotes ?? '')
    setError('')
    setIsEditing(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setError('')

      await updateProject(projectId, {
        notes: notes.trim(),
      })

      await onUpdated()
      setIsEditing(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося зберегти нотатки',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <StickyNote size={20} />
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Нотатки
            </h2>

          </div>
        </div>

        {canManage && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {initialNotes ? <Pencil size={17} /> : <Plus size={17} />}
            {initialNotes ? 'Редагувати' : 'Додати'}
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            placeholder="Наприклад: клієнт просить монтаж до кінця місяця..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500"
          />

          {error && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={cancelEditing}
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
      ) : initialNotes ? (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {initialNotes}
        </p>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Нотаток поки немає.
        </div>
      )}
    </section>
  )
}
