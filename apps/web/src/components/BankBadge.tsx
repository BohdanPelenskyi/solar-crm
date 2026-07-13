import { Landmark } from 'lucide-react'
import { getBankMeta } from '../constants/banks'

type BankBadgeProps = {
  bankName?: string | null
  compact?: boolean
}

export function BankBadge({
  bankName,
  compact = false,
}: BankBadgeProps) {
  if (!bankName) {
    return null
  }

  const bank = getBankMeta(bankName)

  if (!bank) {
    return (
      <span
        title={bankName}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm"
      >
        <Landmark size={13} className="shrink-0 text-slate-400" />
        <span className="min-w-0 truncate">{bankName}</span>
      </span>
    )
  }

  return (
    <span
      title={bank.label}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm"
    >
      <img
        src={bank.icon}
        alt=""
        className="h-4 w-4 shrink-0 rounded-sm object-contain"
        loading="lazy"
      />
      <span className="min-w-0 truncate">
        {compact ? bank.shortLabel : bank.label}
      </span>
    </span>
  )
}
