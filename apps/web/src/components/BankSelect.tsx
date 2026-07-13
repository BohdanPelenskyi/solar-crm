import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { BANKS, getBankMeta } from '../constants/banks'
import { BankIcon } from './BankIcon'

type BankSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type BankOption = {
  value: string
  label: string
}

const extraOptions: BankOption[] = [
  { value: 'Інше', label: 'Інше' },
]

export function BankSelect({
  value,
  onChange,
  placeholder = 'Оберіть банк',
}: BankSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = useMemo<BankOption[]>(() => {
    return [
      ...BANKS.map((bank) => ({ value: bank.label, label: bank.label })),
      ...extraOptions,
    ]
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption ? (
            <>
              <BankIcon bankName={selectedOption.value} sizeClassName="h-5 w-5" />
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate text-slate-400">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-50"
          >
            <span>{placeholder}</span>
            {!value && <Check size={16} className="text-blue-600" />}
          </button>

          {options.map((option) => {
            const isSelected = option.value === value
            const bank = getBankMeta(option.value)

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <BankIcon
                    bankName={bank ? bank.label : option.label}
                    sizeClassName="h-5 w-5"
                  />
                  <span className="truncate">{option.label}</span>
                </span>

                {isSelected && <Check size={16} className="shrink-0 text-blue-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
