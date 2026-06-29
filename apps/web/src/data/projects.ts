export type ProjectStatus =
  | 'В роботі'
  | 'КП відправлено'
  | 'Монтаж'
  | 'Завершено'

export type Project = {
  id: number
  name: string
  status: ProjectStatus
  location: string
  source: string
  contactName: string
  phone: string
  createdAt: string
}

export const projects: Project[] = [
  {
    id: 1,
    name: 'СЕС 30 кВт — ресторан Green Hall',
    status: 'В роботі',
    location: 'Львівська обл., с. Сокільники',
    source: 'Instagram',
    contactName: 'Василь',
    phone: '+380 96 012 26 20',
    createdAt: '12.05.2026',
  },
  {
    id: 2,
    name: 'СЕС 50 кВт — склад',
    status: 'КП відправлено',
    location: 'м. Львів',
    source: 'Рекомендація',
    contactName: 'Ігор',
    phone: '+380 67 000 00 00',
    createdAt: '18.05.2026',
  },
  {
    id: 3,
    name: 'Гібридна СЕС 10 кВт — магазин',
    status: 'Монтаж',
    location: 'м. Дрогобич',
    source: 'Google',
    contactName: 'Олег',
    phone: '+380 93 111 11 11',
    createdAt: '22.05.2026',
  },
  {
    id: 4,
    name: 'УЗЕ 100 кВт·год — виробництво',
    status: 'Завершено',
    location: 'Львівська обл.',
    source: 'Партнер',
    contactName: 'Марія',
    phone: '+380 50 222 22 22',
    createdAt: '01.06.2026',
  },
]

export const statusStyles: Record<ProjectStatus, string> = {
  'В роботі': 'bg-emerald-100 text-emerald-700',
  'КП відправлено': 'bg-sky-100 text-sky-700',
  Монтаж: 'bg-amber-100 text-amber-700',
  Завершено: 'bg-violet-100 text-violet-700',
}