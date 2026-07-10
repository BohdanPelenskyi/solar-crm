import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Paperclip, Plus, Trash2, Upload } from 'lucide-react'
import {
  createProjectTransaction,
  type ApiPaymentMethod,
  type ApiTransactionAttachmentType,
  type ApiTransactionType,
  type CreateTransactionAttachmentInput,
} from '../lib/api'

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

const bankOptions = [
  '',
  'КредоБанк',
  'ПриватБанк',
  'ОщадБанк',
  'Монобанк',
  'Райффайзен Банк',
  'ПУМБ',
  'Укргазбанк',
  'Укрсиббанк',
  'Sense Bank',
  'Інше',
]

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
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )

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

  const tooLargeFile = files.find(
    (file) => file.size > 15 * 1024 * 1024,
  )

  if (tooLargeFile) {
    return 'Максимальний розмір одного файлу — 15 МБ'
  }

  const invalidFile = files.find(
    (file) => !allowedAttachmentTypes.has(file.type),
  )

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
    const inputRef =
      attachmentType === 'INVOICE' ? invoiceInputRef : expenseDocInputRef
    const label = attachmentTypeLabels[attachmentType]
    const selectedFiles = attachments
      .map((attachment, index) => ({ ...attachment, index }))
      .filter((attachment) => attachment.type === attachmentType)

    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Можна додати один або декілька файлів
            </p>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDraggingType(attachmentType)
          }}
          onDragLeave={() => setDraggingType(null)}
          onDrop={(event) => handleDrop(event, attachmentType)}
          className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
            draggingType === attachmentType
              ? 'border-blue-300 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          <Upload size={22} className="mx-auto text-blue-600" />
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Перетягни файл сюди або натисни для вибору
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, Word, Excel або зображення до 15 МБ
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            selectAttachments(
              Array.from(event.target.files ?? []),
              attachmentType,
            )

            event.target.value = ''
          }}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((attachment) => (
              <div
                key={`${attachment.file.name}-${attachment.file.size}-${attachment.index}`}
                className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
              >
                <Paperclip size={15} className="shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {attachment.file.name}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatFileSize(attachment.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectedAttachment(attachment.index)}
                  className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Прибрати файл"
                >
                  <Trash2 size={14} />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Додати {operationLabel}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Фінансова операція для цього проєкту
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Сума, грн
                </span>

                <input
                  required
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
                  placeholder="Наприклад: 25000"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Контрагент
                </span>

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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Спосіб оплати
                  </span>

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
                    {Object.entries(paymentMethodLabels).map(
                      ([method, label]) => (
                        <option key={method} value={method}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Банк
                  </span>

                  <select
                    value={form.accountName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountName: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {bankOptions.map((bank) => (
                      <option key={bank || 'empty'} value={bank}>
                        {bank || 'Оберіть банк'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Дата операції
                </span>

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

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Коментар
                </span>

                <textarea
                  rows={3}
                  value={form.comment}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Наприклад: аванс, закупівля панелей..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-slate-700">
                  Документи до операції
                </span>

                {renderUploadZone('INVOICE')}
                {renderUploadZone('EXPENSE_DOC')}
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
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  isIncome
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
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
