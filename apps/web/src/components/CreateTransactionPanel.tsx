import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  createProjectTransaction,
  type ApiPaymentMethod,
  type ApiTransactionType,
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

function getLocalDateTimeValue() {
  const now = new Date()
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )

  return localDate.toISOString().slice(0, 16)
}

export function CreateTransactionPanel({
  projectId,
  type,
  onCreated,
}: CreateTransactionPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

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

  function closeModal() {
    if (isSaving) {
      return
    }

    setIsOpen(false)
    setError('')
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

      await createProjectTransaction(projectId, {
        type,
        amount,
        counterparty: form.counterparty.trim() || undefined,
        paymentMethod: form.paymentMethod,
        accountName: form.accountName.trim() || undefined,
        occurredAt: new Date(form.occurredAt).toISOString(),
        comment: form.comment.trim() || undefined,
      })

      await onCreated()

      setForm({
        amount: '',
        counterparty: '',
        paymentMethod: 'BANK_TRANSFER',
        accountName: '',
        occurredAt: getLocalDateTimeValue(),
        comment: '',
      })

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
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
                    placeholder="Основний рахунок"
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
                  placeholder="Наприклад: аванс, закупівля панелей..."
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