import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { deleteProject } from '../lib/api'
import { useUndoDelete } from './UndoDeleteProvider'

type DeleteProjectButtonProps = {
  projectId: number
  projectName: string
  onDeleted: () => void
}

export function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
}: DeleteProjectButtonProps) {
  const { canManage } = useAuth()
  const { scheduleUndoDelete } = useUndoDelete()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!canManage) {
    return null
  }

  function handleDelete() {
    setIsDeleting(true)

    scheduleUndoDelete({
      message: `Проєкт «${projectName}» буде видалено`,
      action: async () => {
        await deleteProject(projectId)
      },
      onCompleted: () => {
        onDeleted()
      },
      onCancel: () => {
        setIsDeleting(false)
      },
      onError: (error) => {
        setIsDeleting(false)

        window.alert(
          error instanceof Error
            ? error.message
            : 'Не вдалося видалити проєкт',
        )
      },
    })
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />
      {isDeleting ? 'Очікує видалення...' : 'Видалити'}
    </button>
  )
}
