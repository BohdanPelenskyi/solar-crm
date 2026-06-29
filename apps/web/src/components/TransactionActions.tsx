import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  deleteProjectTransaction,
  updateProjectTransaction,
  type ApiFinancialTransaction,
  type ApiPaymentMethod,
} from '../lib/api'

type TransactionActionsProps = {
  transaction: ApiFinancialTransaction
  onChanged: () => Promise<void> | void
}

type TransactionForm = {
  amount: string
  counterparty: string
  paymentMethod: ApiPaymentMethod
  accountName: string
  occurredAt: string
  comment: string
}

const paymentMethodLabels: Record<ApiPaymentMethod, string> = {
  CASH: 'Готівка',
  BANK_TRANSFER: 'Банківський переказ',
  CARD: 'Картка',
  OTHER: 'Інше',
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  )

  return localDate.toISOString().slice(0, 16)
}

function getInitialForm(
  transaction: ApiFinancialTransaction,
): TransactionForm {
  return {
    amount: String(transaction.amount),
    counterparty: transaction.counterparty ?? '',
    paymentMethod: transaction.paymentMethod,
    accountName: transaction.accountName ?? '',
    occurredAt: toDateTimeLocal(transaction.occurredAt),
    comment: transaction.comment ?? '',
  }
}

export function TransactionActions({
  transaction,
  onChanged,
}: TransactionActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TransactionForm>(
    getInitialForm(transaction),
  )

  const operationLabel =
    transaction.type === 'INCOME' ? 'прихід' : 'витрату'

  function openEdit() {
    setForm(getInitialForm(transaction))
    setError('')
    setIsEditing(true)
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsEditing(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(form.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Вкажи коректну суму')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await updateProjectTransaction(transaction.id, {
        type: transaction.type,
        amount,
        counterparty: form.counterparty.trim() || undefined,
        paymentMethod: form.paymentMethod,
        accountName: form.accountName.trim() || undefined,
        occurredAt: new Date(form.occurredAt).toISOString(),
        comment: form.comment.trim() || undefined,
      })

      await onChanged()
      setIsEditing(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося оновити операцію',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Видалити ${operationLabel}? Цю дію неможливо скасувати.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)

      await deleteProjectTransaction(transaction.id)
      await onChanged()
    } catch (requestError) {
      window.alert(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося видалити операцію',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={openEdit}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
          title="Редагувати"
        >
          <Pencil size={16} />
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          title="Видалити"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Редагувати {operationLabel}
            </h2>

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
                    Рахунок / каса
                  </span>

                  <input
                    value={form.accountName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountName: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
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
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </label>

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
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}