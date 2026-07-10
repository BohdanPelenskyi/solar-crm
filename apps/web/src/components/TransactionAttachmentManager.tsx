import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Paperclip, Plus, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  addTransactionAttachments,
  deleteTransactionAttachment,
  getUploadUrl,
  type ApiFinancialTransaction,
} from '../lib/api'

type TransactionAttachmentManagerProps = {
  transaction: ApiFinancialTransaction
  onChanged: () => Promise<void> | void
}

const allowedAttachmentTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function getFilesError(files: File[], existingCount: number) {
  if (files.length === 0) {
    return 'Обери файл'
  }

  if (existingCount + files.length > 2) {
    return `До однієї операції можна додати максимум 2 файли. Зараз вже є ${existingCount}.`
  }

  const tooLargeFile = files.find((file) => file.size > 15 * 1024 * 1024)

  if (tooLargeFile) {
    return 'Максимальний розмір одного файлу — 15 МБ'
  }

  const invalidFile = files.find((file) => !allowedAttachmentTypes.has(file.type))

  if (invalidFile) {
    return 'Дозволені PDF, DOC, DOCX, XLS, XLSX, JPG, PNG та WEBP'
  }

  return ''
}

export function TransactionAttachmentManager({
  transaction,
  onChanged,
}: TransactionAttachmentManagerProps) {
  const { canManage } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const attachments = transaction.attachments ?? []
  const remainingFilesCount = Math.max(0, 2 - attachments.length)

  async function uploadFiles(files: File[]) {
    const selectedFiles = files.slice(0, remainingFilesCount)
    const validationError = getFilesError(selectedFiles, attachments.length)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await addTransactionAttachments(transaction.id, selectedFiles)
      await onChanged()

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося додати файл',
      )
    } finally {
      setIsSaving(false)
      setIsDragging(false)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(Array.from(event.target.files ?? []))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    void uploadFiles(Array.from(event.dataTransfer.files))
  }

  async function handleDelete(attachmentId: number) {
    const confirmed = window.confirm('Видалити файл з цієї операції?')

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(attachmentId)
      setError('')

      await deleteTransactionAttachment(attachmentId)
      await onChanged()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося видалити файл',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-2 max-w-full min-w-0 space-y-2">
      {attachments.length > 0 && (
        <div className="flex max-w-full flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <a
                href={getUploadUrl(attachment.storageKey)}
                target="_blank"
                rel="noreferrer"
                title={`${attachment.originalName} · ${formatFileSize(attachment.size)}`}
                className="inline-flex min-w-0 max-w-full items-center gap-1 transition hover:text-blue-700"
              >
                <Paperclip size={13} className="shrink-0" />
                <span className="max-w-[180px] truncate sm:max-w-[240px]">
                  Файл {index + 1}: {attachment.originalName}
                </span>
              </a>

              {canManage && (
                <button
                  type="button"
                  disabled={deletingId === attachment.id}
                  onClick={() => void handleDelete(attachment.id)}
                  className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  title="Видалити файл"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && remainingFilesCount > 0 && (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-fit max-w-full rounded-xl border border-dashed px-2.5 py-1.5 transition ${
            isDragging
              ? 'border-blue-300 bg-blue-50'
              : 'border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          <button
            type="button"
            disabled={isSaving}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
          >
            {isSaving ? (
              <Upload size={14} className="shrink-0" />
            ) : (
              <Plus size={14} className="shrink-0" />
            )}
            {isSaving
              ? 'Завантаження...'
              : `Додати файл (${remainingFilesCount} ще можна)`}
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple={remainingFilesCount > 1}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="max-w-full rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
