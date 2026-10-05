import type { ApiProjectStatus } from '../lib/api'

type ProjectStatusInfo = {
  label: string
  className: string
}

export const PROJECT_STATUS_INFO: Record<
  ApiProjectStatus,
  ProjectStatusInfo
> = {
  NEW: {
    label: 'Новий',
    className: 'bg-slate-100 text-slate-700',
  },
  PREPARING_PROPOSAL: {
    label: 'Готується КП',
    className: 'bg-blue-100 text-blue-700',
  },
  PROPOSAL_SENT: {
    label: 'КП надіслано',
    className: 'bg-sky-100 text-sky-700',
  },
  CONTRACT_APPROVAL: {
    label: 'Погодження договору',
    className: 'bg-indigo-100 text-indigo-700',
  },
  CONTRACT_SIGNED: {
    label: 'Договір укладено',
    className: 'bg-violet-100 text-violet-700',
  },
  AWAITING_PAYMENT: {
    label: 'Очікуємо оплату',
    className: 'bg-amber-100 text-amber-700',
  },
  PAID: {
    label: 'Оплачено',
    className: 'bg-emerald-100 text-emerald-700',
  },
  PREPARING_IMPLEMENTATION: {
    label: 'Підготовка до реалізації',
    className: 'bg-cyan-100 text-cyan-700',
  },
  IN_PROGRESS: {
    label: 'Виконується',
    className: 'bg-green-100 text-green-700',
  },
  PAUSED: {
    label: 'Призупинено',
    className: 'bg-orange-100 text-orange-700',
  },
  COMPLETED: {
    label: 'Завершено',
    className: 'bg-teal-100 text-teal-700',
  },
  REFUSED: {
    label: 'Відмова',
    className: 'bg-rose-100 text-rose-700',
  },
  REMIND_LATER: {
    label: 'Нагадати пізніше',
    className: 'bg-yellow-100 text-yellow-800',
  },
  NO_LONGER_RELEVANT: {
    label: 'Вже не актуально',
    className: 'bg-gray-100 text-gray-700',
  },
}

export const PROJECT_STATUS_OPTIONS = (
  Object.keys(PROJECT_STATUS_INFO) as ApiProjectStatus[]
).map((value) => ({
  value,
  ...PROJECT_STATUS_INFO[value],
}))
