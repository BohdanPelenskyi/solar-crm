import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Paperclip, Plus, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useUndoDelete } from './UndoDeleteProvider'
import {
  addTransactionAttachments,
  deleteTransactionAttachment,
  getUploadUrl,
  type ApiFinancialTransaction,
  type ApiTransactionAttachment,
  type ApiTransactionAttachmentType,
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

const attachmentTypeLabels: Record<ApiTransactionAttachmentType, string> = {
  INVOICE: 'Рахунок',
  EXPENSE_DOC: 'Видаткова',
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function getFilesError(files: File[]) {
  if (files.length === 0) {
    return 'Обери файл'
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
  const { scheduleUndoDelete } = useUndoDelete()
  const invoiceInputRef = useRef<HTMLInputElement>(null)
  const expenseDocInputRef = useRef<HTMLInputElement>(null)
  const [savingType, setSavingType] =
    useState<ApiTransactionAttachmentType | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [draggingType, setDraggingType] =
    useState<ApiTransactionAttachmentType | null>(null)
  const [error, setError] = useState('')

  const attachments = transaction.attachments ?? []
  const invoiceAttachments = attachments.filter(
    (attachment) => attachment.type === 'INVOICE' || !attachment.type,
  )
  const expenseDocAttachments = attachments.filter(
    (attachment) => attachment.type === 'EXPENSE_DOC',
  )

  async function uploadFiles(
    files: File[],
    attachmentType: ApiTransactionAttachmentType,
  ) {
    const validationError = getFilesError(files)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSavingType(attachmentType)
      setError('')

      await addTransactionAttachments(transaction.id, attachmentType, files)
      await onChanged()

      if (invoiceInputRef.current) {
        invoiceInputRef.current.value = ''
      }

      if (expenseDocInputRef.current) {
        expenseDocInputRef.current.value = ''
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося додати файл',
      )
    } finally {
      setSavingType(null)
      setDraggingType(null)
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>,
    attachmentType: ApiTransactionAttachmentType,
  ) {
    void uploadFiles(Array.from(event.target.files ?? []), attachmentType)
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    attachmentType: ApiTransactionAttachmentType,
  ) {
    event.preventDefault()
    setDraggingType(null)
    void uploadFiles(Array.from(event.dataTransfer.files), attachmentType)
  }

  function handleDelete(attachmentId: number) {
    setDeletingId(attachmentId)
    setError('')

    scheduleUndoDelete({
      message: 'Файл транзакції буде видалено',
      action: async () => {
        await deleteTransactionAttachment(attachmentId)
      },
      onCompleted: async () => {
        await onChanged()
        setDeletingId(null)
      },
      onCancel: () => {
        setDeletingId(null)
      },
      onError: (requestError) => {
        setDeletingId(null)

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не вдалося видалити файл',
        )
      },
    })
  }

  function renderAttachmentList(items: ApiTransactionAttachment[]) {
    if (items.length === 0) {
      return (
        <p className="rounded-lg bg-white/70 px-2 py-1.5 text-xs text-slate-400">
          Файли ще не додані
        </p>
      )
    }

    return (
      <div className="flex max-w-full flex-wrap gap-2">
        {items.map((attachment) => (
          <div
            key={attachment.id}
            className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
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
                {attachment.originalName}
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
    )
  }

  function renderUploadSection(
    attachmentType: ApiTransactionAttachmentType,
    items: ApiTransactionAttachment[],
  ) {
    const inputRef =
      attachmentType === 'INVOICE' ? invoiceInputRef : expenseDocInputRef
    const label = attachmentTypeLabels[attachmentType]
    const isSaving = savingType === attachmentType

    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <div className="mt-1">
              {renderAttachmentList(items)}
            </div>
          </div>
        </div>

        {canManage && (
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDraggingType(attachmentType)
            }}
            onDragLeave={() => setDraggingType(null)}
            onDrop={(event) => handleDrop(event, attachmentType)}
            onClick={() => inputRef.current?.click()}
            className={`mt-2 cursor-pointer rounded-lg border border-dashed px-2.5 py-2 transition ${
              draggingType === attachmentType
                ? 'border-blue-300 bg-blue-50'
                : 'border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <button
              type="button"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60"
            >
              {isSaving ? (
                <Upload size={14} className="shrink-0" />
              ) : (
                <Plus size={14} className="shrink-0" />
              )}
              {isSaving ? 'Завантаження...' : `Додати ${label.toLowerCase()}`}
            </button>

            <p className="mt-1 text-[11px] text-slate-400">
              Перетягни файл сюди або натисни для вибору
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
              onChange={(event) => handleInputChange(event, attachmentType)}
              className="hidden"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 max-w-full min-w-0 space-y-2">
      <div className="grid gap-2 lg:grid-cols-2">
        {renderUploadSection('INVOICE', invoiceAttachments)}
        {renderUploadSection('EXPENSE_DOC', expenseDocAttachments)}
      </div>

      {error && (
        <p className="max-w-full rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
