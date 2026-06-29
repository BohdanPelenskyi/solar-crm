import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProject } from '../lib/api'

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
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Видалити проєкт «${projectName}»?\n\nБудуть видалені контакти, фінанси, документи, фото та відео. Цю дію неможливо скасувати.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)

      await deleteProject(projectId)
      onDeleted()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Не вдалося видалити проєкт',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={() => void handleDelete()}
      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />

      {isDeleting ? 'Видалення...' : 'Видалити'}
    </button>
  )
}