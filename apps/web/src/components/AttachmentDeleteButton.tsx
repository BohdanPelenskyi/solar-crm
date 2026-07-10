import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  deleteProjectDocument,
  deleteProjectMedia,
} from '../lib/api'
import { useUndoDelete } from './UndoDeleteProvider'

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
  const { scheduleUndoDelete } = useUndoDelete()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!canManage) {
    return null
  }

  const label = kind === 'document' ? 'документ' : 'фото або відео'

  function handleDelete() {
    setIsDeleting(true)

    scheduleUndoDelete({
      message: `${kind === 'document' ? 'Документ' : 'Файл'} буде видалено`,
      action: async () => {
        if (kind === 'document') {
          await deleteProjectDocument(id)
        } else {
          await deleteProjectMedia(id)
        }
      },
      onCompleted: async () => {
        await onDeleted()
        setIsDeleting(false)
      },
      onCancel: () => {
        setIsDeleting(false)
      },
      onError: (error) => {
        setIsDeleting(false)

        window.alert(
          error instanceof Error
            ? error.message
            : `Не вдалося видалити ${label}`,
        )
      },
    })
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
      title={isDeleting ? 'Очікує видалення' : 'Видалити'}
    >
      <Trash2 size={17} />
    </button>
  )
}
