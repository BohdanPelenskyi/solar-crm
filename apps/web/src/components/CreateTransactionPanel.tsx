import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Paperclip, Plus, Trash2 } from 'lucide-react'
import {
  createProjectTransaction,
  type ApiPaymentMethod,
  type ApiTransactionAttachmentType,
  type ApiTransactionType,
  type CreateTransactionAttachmentInput,
} from '../lib/api'
import { BankSelect } from './BankSelect'

type CreateTransactionPanelProps = {
  projectId: number
  type: ApiTransactionType
  onCreated: () => Promise<void> | void
}

const paymentMethodLabels: Record<ApiPaymentMethod, string> = {
  CASH: 'Готівка',
  BANK_TRANSFER: 'Банківський переказ',
  CARD: 'Картка',
  OTHER: 'Інше',
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

function getLocalDateTimeValue() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)

  return localDate.toISOString().slice(0, 16)
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

export function CreateTransactionPanel({
  projectId,
  type,
  onCreated,
}: CreateTransactionPanelProps) {
  const invoiceInputRef = useRef<HTMLInputElement>(null)
  const expenseDocInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [draggingType, setDraggingType] =
    useState<ApiTransactionAttachmentType | null>(null)
  const [attachments, setAttachments] =
    useState<CreateTransactionAttachmentInput[]>([])

  const isIncome = type === 'INCOME'
  const operationLabel = isIncome ? 'прихід' : 'витрату'

  const [form, setForm] = useState({
    amount: '',
    counterparty: '',
    paymentMethod: 'BANK_TRANSFER' as ApiPaymentMethod,
    accountName: '',
    occurredAt: getLocalDateTimeValue(),
    comment: '',
  })

  function resetForm() {
    setForm({
      amount: '',
      counterparty: '',
      paymentMethod: 'BANK_TRANSFER',
      accountName: '',
      occurredAt: getLocalDateTimeValue(),
      comment: '',
    })
    setAttachments([])
    setError('')
    setDraggingType(null)

    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = ''
    }

    if (expenseDocInputRef.current) {
      expenseDocInputRef.current.value = ''
    }
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    resetForm()
    setIsOpen(false)
  }

  function selectAttachments(
    files: File[],
    attachmentType: ApiTransactionAttachmentType,
  ) {
    const validationError = getFilesError(files)

    if (validationError) {
      setError(validationError)
      return
    }

    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        type: attachmentType,
        file,
      })),
    ])
    setError('')
  }

  function removeSelectedAttachment(index: number) {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    attachmentType: ApiTransactionAttachmentType,
  ) {
    event.preventDefault()
    setDraggingType(null)
    selectAttachments(Array.from(event.dataTransfer.files), attachmentType)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(form.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Вкажи коректну суму операції')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await createProjectTransaction(
        projectId,
        {
          type,
          amount,
          counterparty: form.counterparty.trim() || undefined,
          paymentMethod: form.paymentMethod,
          accountName: form.accountName.trim() || undefined,
          occurredAt: new Date(form.occurredAt).toISOString(),
          comment: form.comment.trim() || undefined,
        },
        attachments,
      )

      await onCreated()
      resetForm()
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося додати операцію',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function renderUploadZone(attachmentType: ApiTransactionAttachmentType) {
    const inputRef = attachmentType === 'INVOICE' ? invoiceInputRef : expenseDocInputRef
    const label = attachmentTypeLabels[attachmentType]
    const selectedFiles = attachments
      .map((attachment, index) => ({ ...attachment, index }))
      .filter((attachment) => attachment.type === attachmentType)

    return (
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDraggingType(attachmentType)
        }}
        onDragLeave={() => setDraggingType(null)}
        onDrop={(event) => handleDrop(event, attachmentType)}
        className={`rounded-xl border px-3 py-2.5 transition ${
          draggingType === attachmentType
            ? 'border-blue-300 bg-blue-50'
            : 'border-slate-100 bg-slate-50/70'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:ring-blue-200"
            title={`Додати ${label.toLowerCase()}`}
            aria-label={`Додати ${label.toLowerCase()}`}
          >
            <Plus size={16} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            selectAttachments(Array.from(event.target.files ?? []), attachmentType)
            event.target.value = ''
          }}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {selectedFiles.map((attachment) => (
              <div
                key={`${attachment.file.name}-${attachment.file.size}-${attachment.index}`}
                className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-700"
              >
                <Paperclip size={13} className="shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {attachment.file.name}
                </span>
                <span className="shrink-0 text-slate-500">
                  {formatFileSize(attachment.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectedAttachment(attachment.index)}
                  className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Прибрати файл"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
          isIncome
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
        }`}
      >
        <Plus size={16} />
        Додати
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-3">
          <form
            onSubmit={handleSubmit}
            className="my-3 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-bold text-slate-900">Додати {operationLabel}</h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Закрити
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Сума, грн</span>

                  <input
                    required
                    autoFocus
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="25000"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Дата операції</span>

                  <input
                    required
                    type="datetime-local"
                    value={form.occurredAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        occurredAt: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Контрагент</span>

                  <input
                    value={form.counterparty}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        counterparty: event.target.value,
                      }))
                    }
                    placeholder="Клієнт, постачальник, підрядник..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Спосіб оплати</span>

                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentMethod: event.target.value as ApiPaymentMethod,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {Object.entries(paymentMethodLabels).map(([method, label]) => (
                      <option key={method} value={method}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Банк</span>
                  <BankSelect
                    value={form.accountName}
                    onChange={(nextValue) =>
                      setForm((current) => ({
                        ...current,
                        accountName: nextValue,
                      }))
                    }
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Коментар</span>

                  <textarea
                    value={form.comment}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Аванс, закупівля, рахунок..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderUploadZone('INVOICE')}
                  {renderUploadZone('EXPENSE_DOC')}
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
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
                {isSaving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
