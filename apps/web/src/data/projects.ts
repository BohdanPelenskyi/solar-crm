import type { ApiProjectStatus } from '../lib/api'
import { PROJECT_STATUS_INFO } from '../constants/projectStatuses'

export type ProjectStatus = ApiProjectStatus

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
    status: 'IN_PROGRESS',
    location: 'Львівська обл., с. Сокільники',
    source: 'Instagram',
    contactName: 'Василь',
    phone: '+380 96 012 26 20',
    createdAt: '12.05.2026',
  },
  {
    id: 2,
    name: 'СЕС 50 кВт — склад',
    status: 'PROPOSAL_SENT',
    location: 'м. Львів',
    source: 'Рекомендація',
    contactName: 'Ігор',
    phone: '+380 67 000 00 00',
    createdAt: '18.05.2026',
  },
  {
    id: 3,
    name: 'Гібридна СЕС 10 кВт — магазин',
    status: 'PREPARING_IMPLEMENTATION',
    location: 'м. Дрогобич',
    source: 'Google',
    contactName: 'Олег',
    phone: '+380 93 111 11 11',
    createdAt: '22.05.2026',
  },
  {
    id: 4,
    name: 'УЗЕ 100 кВт·год — виробництво',
    status: 'COMPLETED',
    location: 'Львівська обл.',
    source: 'Партнер',
    contactName: 'Марія',
    phone: '+380 50 222 22 22',
    createdAt: '01.06.2026',
  },
]

export const statusStyles = Object.fromEntries(
  Object.entries(PROJECT_STATUS_INFO).map(([status, info]) => [
    status,
    info.className,
  ]),
) as Record<ProjectStatus, string>