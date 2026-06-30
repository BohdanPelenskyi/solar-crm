import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  deleteProjectDocument,
  deleteProjectMedia,
} from '../lib/api'

type AttachmentDeleteButtonProps = {
  kind: 'document' | 'media'
  id: number
  onDeleted: () => Promise<void> | void
}

export function AttachmentDeleteButton({
  kind,
  id,
  onDeleted,
}: AttachmentDeleteButtonProps) {
  const { canManage } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!canManage) {
    return null
  }

  const label = kind === 'document' ? 'документ' : 'фото або відео'

  async function handleDelete() {
    const confirmed = window.confirm(
      `Видалити ${label}? Цю дію неможливо скасувати.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)

      if (kind === 'document') {
        await deleteProjectDocument(id)
      } else {
        await deleteProjectMedia(id)
      }

      await onDeleted()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Не вдалося видалити файл',
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
      className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
      title="Видалити"
    >
      <Trash2 size={17} />
    </button>
  )
}
