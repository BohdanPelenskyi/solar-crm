import { Landmark } from 'lucide-react'
import { getBankMeta } from '../constants/banks'

type BankIconProps = {
  bankName?: string | null
  className?: string
  sizeClassName?: string
}

export function BankIcon({
  bankName,
  className = '',
  sizeClassName = 'h-6 w-6',
}: BankIconProps) {
  if (!bankName) {
    return null
  }

  const bank = getBankMeta(bankName)

  if (!bank) {
    return (
      <span
        title={bankName}
        className={`inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm ${sizeClassName} ${className}`.trim()}
      >
        <Landmark size={14} />
      </span>
    )
  }

  return (
    <span
      title={bank.label}
      className={`inline-flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm ${sizeClassName} ${className}`.trim()}
    >
      <img
        src={bank.icon}
        alt={bank.label}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </span>
  )
}
