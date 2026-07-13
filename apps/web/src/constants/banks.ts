export type BankMeta = {
  value: string
  label: string
  shortLabel: string
  icon: string
  aliases: string[]
}

export const BANKS: BankMeta[] = [
  {
    value: 'privatbank',
    label: 'ПриватБанк',
    shortLabel: 'ПриватБанк',
    icon: '/banks/privatbank.jpeg',
    aliases: ['приватбанк', 'приват банк', 'privatbank', 'privat bank', 'privat'],
  },
  {
    value: 'monobank',
    label: 'Монобанк',
    shortLabel: 'Mono',
    icon: '/banks/monobank.jpeg',
    aliases: ['монобанк', 'mono', 'monobank', 'mono bank'],
  },
  {
    value: 'oschadbank',
    label: 'Ощадбанк',
    shortLabel: 'Ощадбанк',
    icon: '/banks/oschadbank.jpeg',
    aliases: ['ощадбанк', 'ощад банк', 'oschadbank', 'oschad bank', 'oschad'],
  },
  {
    value: 'pumb',
    label: 'ПУМБ',
    shortLabel: 'ПУМБ',
    icon: '/banks/pumb.jpeg',
    aliases: ['пумб', 'pumb', 'first ukrainian international bank'],
  },
  {
    value: 'raiffeisen',
    label: 'Райффайзен Банк',
    shortLabel: 'Райффайзен',
    icon: '/banks/raiffeisen.png',
    aliases: ['райффайзен банк', 'райф', 'raiffeisen', 'raiffeisen bank'],
  },
  {
    value: 'sensebank',
    label: 'Sense Bank',
    shortLabel: 'Sense',
    icon: '/banks/sensebank.jpeg',
    aliases: ['sense bank', 'sensebank', 'сенс банк', 'сенс'],
  },
  {
    value: 'ukrsibbank',
    label: 'Укрсиббанк',
    shortLabel: 'Укрсиб',
    icon: '/banks/ukrsibbank.jpeg',
    aliases: ['укрсиббанк', 'укрсиб банк', 'ukrsibbank', 'ukrsib bank'],
  },
]

function normalizeBankName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function getBankMeta(bankName?: string | null) {
  if (!bankName) {
    return null
  }

  const normalized = normalizeBankName(bankName)

  return (
    BANKS.find((bank) => bank.value === normalized) ??
    BANKS.find((bank) => normalizeBankName(bank.label) === normalized) ??
    BANKS.find((bank) => normalizeBankName(bank.shortLabel) === normalized) ??
    BANKS.find((bank) =>
      bank.aliases.some((alias) => normalizeBankName(alias) === normalized),
    ) ??
    null
  )
}
