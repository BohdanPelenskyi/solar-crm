export const API_URL = 'http://localhost:3000/api'

export type ApiProjectStatus =
  | 'DRAFT'
  | 'PROPOSAL_SENT'
  | 'IN_PROGRESS'
  | 'INSTALLATION'
  | 'COMPLETED'
  | 'CANCELED'

export type ApiContactRole =
  | 'OWNER'
  | 'ACCOUNTANT'
  | 'ELECTRICIAN'
  | 'MANAGER'
  | 'OTHER'

export type ApiTransactionType = 'INCOME' | 'EXPENSE'

export type ApiFileCategory =
  | 'PROPOSAL'
  | 'PROJECT_DOCUMENT'
  | 'FINANCIAL_DOCUMENT'
  | 'OTHER'

export type ApiMediaType = 'PHOTO' | 'VIDEO'

export type ApiProjectContact = {
  id: number
  projectId: number
  fullName: string
  phone: string
  role: ApiContactRole
  position: string | null
  isPrimary: boolean
  createdAt: string
}
export type ApiPaymentMethod = | 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'

export type ApiFinancialTransaction = {
  id: number
  projectId: number
  type: ApiTransactionType
  amount: string | number
  counterparty: string | null
 paymentMethod: ApiPaymentMethod
  accountName: string | null
  occurredAt: string
  comment: string | null
  receiptPath: string | null
  createdAt: string
}

export type ApiProjectFile = {
  id: number
  projectId: number
  category: ApiFileCategory
  originalName: string
  storageKey: string
  mimeType: string
  size: number
  isFinal: boolean
  uploadedAt: string
}

export type ApiProjectMedia = {
  id: number
  projectId: number
  type: ApiMediaType
  originalName: string
  storageKey: string
  thumbnailKey: string | null
  mimeType: string
  size: number
  durationSeconds: number | null
  createdAt: string
}

export type ApiProject = {
  id: number
  name: string
  status: ApiProjectStatus
  source: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  contacts: ApiProjectContact[]
}

export type ApiProjectDetails = ApiProject & {
  transactions: ApiFinancialTransaction[]
  files: ApiProjectFile[]
  media: ApiProjectMedia[]
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Проєкт не знайдено')
    }

    throw new Error('Не вдалося отримати дані з API')
  }

  return response.json() as Promise<T>
}

export function getProjects(): Promise<ApiProject[]> {
  return request<ApiProject[]>('/projects')
}

export function getProject(id: number): Promise<ApiProjectDetails> {
  return request<ApiProjectDetails>(`/projects/${id}`)
}
export type CreateProjectContactPayload = {
  fullName: string
  phone: string
  role: ApiContactRole
  position?: string
  isPrimary: boolean
}

export async function createProjectContact(
  projectId: number,
  payload: CreateProjectContactPayload,
): Promise<ApiProjectContact> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/contacts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new Error('Не вдалося додати контакт')
  }

  return response.json() as Promise<ApiProjectContact>
}

export type CreateProjectPayload = {
  name: string
  status: ApiProjectStatus
  source?: string
  location?: string
  notes?: string
}

export type CreatedProject = {
  id: number
  name: string
  status: ApiProjectStatus
  source: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<CreatedProject> {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Не вдалося створити проєкт')
  }

  return response.json() as Promise<CreatedProject>
}

export type CreateProjectTransactionPayload = {
  type: ApiTransactionType
  amount: number
  counterparty?: string
  paymentMethod: ApiPaymentMethod
  accountName?: string
  occurredAt: string
  comment?: string
}

export async function createProjectTransaction(
  projectId: number,
  payload: CreateProjectTransactionPayload,
): Promise<ApiFinancialTransaction> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/transactions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new Error('Не вдалося додати фінансову операцію')
  }

  return response.json() as Promise<ApiFinancialTransaction>
}

export type UpdateProjectTransactionPayload =
  CreateProjectTransactionPayload

export async function updateProjectTransaction(
  transactionId: number,
  payload: UpdateProjectTransactionPayload,
): Promise<ApiFinancialTransaction> {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Не вдалося оновити фінансову операцію')
  }

  return response.json() as Promise<ApiFinancialTransaction>
}

export async function deleteProjectTransaction(
  transactionId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Не вдалося видалити фінансову операцію')
  }
}

export async function uploadProjectDocument(
  projectId: number,
  file: File,
  category: ApiFileCategory,
  isFinal = false,
): Promise<ApiProjectFile> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('category', category)
  formData.append('isFinal', String(isFinal))

  const response = await fetch(
    `${API_URL}/projects/${projectId}/documents`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося завантажити документ',
    )
  }

  return response.json() as Promise<ApiProjectFile>
}

export function getUploadUrl(storageKey: string) {
  return `http://localhost:3000/uploads/${storageKey}`
}
