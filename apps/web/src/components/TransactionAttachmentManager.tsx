import { useRef, useState, type DragEvent } from 'react'
import { Paperclip, Plus, Trash2 } from 'lucide-react'
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
import { isImageFile, optimizeImageFile } from '../lib/imageOptimization'

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
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence',
])

const attachmentTypeLabels: Record<ApiTransactionAttachmentType, string> = {
  INVOICE: 'Рахунок',
  EXPENSE_DOC: 'Видаткова',
  PAYMENT_ORDER: 'Платіжна інструкція',
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

  const invalidFile = files.find(
    (file) => !allowedAttachmentTypes.has(file.type) && !isImageFile(file),
  )

  if (invalidFile) {
    return 'Дозволені PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP та HEIC'
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
  const paymentOrderInputRef = useRef<HTMLInputElement>(null)
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

  const paymentOrderAttachments = attachments.filter(
    (attachment) => attachment.type === 'PAYMENT_ORDER',
  )
  const isIncome = transaction.type === 'INCOME'

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

      const optimizedFiles = await Promise.all(
        files.map((file) => (isImageFile(file) ? optimizeImageFile(file) : file)),
      )

      await addTransactionAttachments(transaction.id, attachmentType, optimizedFiles)
      await onChanged()

      if (invoiceInputRef.current) {
        invoiceInputRef.current.value = ''
      }

      if (expenseDocInputRef.current) {
        expenseDocInputRef.current.value = ''
      }

      if (paymentOrderInputRef.current) {
        paymentOrderInputRef.current.value = ''
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося додати файл',
      )
    } finally {
      setSavingType(null)
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    attachmentType: ApiTransactionAttachmentType,
  ) {
    event.preventDefault()
    setDraggingType(null)
    void uploadFiles(Array.from(event.dataTransfer.files), attachmentType)
  }

  function handleDelete(attachment: ApiTransactionAttachment) {
    setDeletingId(attachment.id)

    scheduleUndoDelete({
      message: `Файл «${attachment.originalName}» буде видалено`,
      action: async () => {
        await deleteTransactionAttachment(attachment.id)
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

        window.alert(
          requestError instanceof Error
            ? requestError.message
            : 'Не вдалося видалити файл',
        )
      },
    })
  }

  function renderAttachmentList(items: ApiTransactionAttachment[]) {
    if (items.length === 0) {
      return null
    }

    return (
      <div className="mt-1.5 space-y-1">
        {items.map((attachment) => (
          <div
            key={attachment.id}
            className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-700"
          >
            <a
              href={getUploadUrl(attachment.storageKey)}
              target="_blank"
              rel="noreferrer"
              title={`${attachment.originalName} · ${formatFileSize(attachment.size)}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1 transition hover:text-blue-700"
            >
              <Paperclip size={13} className="shrink-0" />
              <span className="max-w-[150px] truncate sm:max-w-[190px]">
                {attachment.originalName}
              </span>
            </a>

            {canManage && (
              <button
                type="button"
                disabled={deletingId === attachment.id}
                onClick={() => handleDelete(attachment)}
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
    canUpload = true,
  ) {
    const inputRef = {
      INVOICE: invoiceInputRef,
      EXPENSE_DOC: expenseDocInputRef,
      PAYMENT_ORDER: paymentOrderInputRef,
    }[attachmentType]
    const label = attachmentTypeLabels[attachmentType]
    const isSaving = savingType === attachmentType

    return (
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDraggingType(attachmentType)
        }}
        onDragLeave={() => setDraggingType(null)}
        onDrop={(event) => handleDrop(event, attachmentType)}
        className={`min-w-[140px] flex-1 rounded-xl border px-2.5 py-1.5 transition ${
          draggingType === attachmentType
            ? 'border-blue-300 bg-blue-50'
            : 'border-slate-100 bg-white/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          {canManage && canUpload && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              title={`Додати ${label.toLowerCase()}`}
              aria-label={`Додати ${label.toLowerCase()}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {renderAttachmentList(items)}

        {isSaving && (
          <p className="mt-2 text-xs font-medium text-blue-700">
            Завантаження...
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
          onChange={(event) => {
            void uploadFiles(
              Array.from(event.target.files ?? []),
              attachmentType,
            )

            event.target.value = ''
          }}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="mt-3 min-w-0">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
        {isIncome ? (
          <>
            {renderUploadSection('PAYMENT_ORDER', paymentOrderAttachments)}
            {/* Старі файли приходів лишаються видимими, але нові не додаються */}
            {invoiceAttachments.length > 0 &&
              renderUploadSection('INVOICE', invoiceAttachments, false)}
            {expenseDocAttachments.length > 0 &&
              renderUploadSection('EXPENSE_DOC', expenseDocAttachments, false)}
          </>
        ) : (
          <>
            {renderUploadSection('INVOICE', invoiceAttachments)}
            {renderUploadSection('EXPENSE_DOC', expenseDocAttachments)}
            {paymentOrderAttachments.length > 0 &&
              renderUploadSection('PAYMENT_ORDER', paymentOrderAttachments, false)}
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
