const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api')

const nativeFetch = globalThis.fetch.bind(globalThis)

const AUTH_TOKEN_STORAGE_KEY = 'solar_crm_access_token'


export type ApiUserRole = 'ADMIN' | 'VIEWER'

export type ApiAuthenticatedUser = {
  id: number
  email: string
  fullName: string
  role: ApiUserRole
}

export type ApiLoginResponse = {
  accessToken: string
  user: ApiAuthenticatedUser
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers)
  const token = getAccessToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return nativeFetch(input, {
    ...init,
    headers,
  })
}

async function getResponseError(
  response: Response,
  fallbackMessage: string,
) {
  const data: unknown = await response.json().catch(() => null)

  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message

    if (typeof message === 'string') {
      return message
    }

    if (Array.isArray(message)) {
      return message.join(', ')
    }
  }

  return fallbackMessage
}

export async function login(
  email: string,
  password: string,
): Promise<ApiLoginResponse> {
  const response = await apiFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(
      await getResponseError(
        response,
        'Не вдалося виконати вхід',
      ),
    )
  }

  return response.json() as Promise<ApiLoginResponse>
}

export async function getCurrentUser(): Promise<ApiAuthenticatedUser> {
  const response = await apiFetch(`${API_URL}/auth/me`)

  if (!response.ok) {
    throw new Error(
      await getResponseError(
        response,
        'Не вдалося перевірити сесію',
      ),
    )
  }

  return response.json() as Promise<ApiAuthenticatedUser>
}

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
  financialSummary: {
  income: number
  expenses: number
  margin: number
  transactionsCount: number
  }
}

export type ApiTaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELED'

export type ApiTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type ApiProjectTask = {
  id: number
  projectId: number
  title: string
  description: string | null
  status: ApiTaskStatus
  priority: ApiTaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type ApiProjectDetails = ApiProject & {
  transactions: ApiFinancialTransaction[]
  files: ApiProjectFile[]
  media: ApiProjectMedia[]
  tasks: ApiProjectTask[]
}

async function request<T>(path: string): Promise<T> {
  const response = await apiFetch(`${API_URL}${path}`)

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
  const response = await apiFetch(
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
  const response = await apiFetch(`${API_URL}/projects`, {
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
  const response = await apiFetch(
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
  const response = await apiFetch(`${API_URL}/transactions/${transactionId}`, {
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
  const response = await apiFetch(`${API_URL}/transactions/${transactionId}`, {
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

  const response = await apiFetch(
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

export async function uploadProjectMedia(
  projectId: number,
  file: File,
): Promise<ApiProjectMedia> {
  const formData = new FormData()

  formData.append('file', file)

  const response = await apiFetch(
    `${API_URL}/projects/${projectId}/media`,
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
        : message || 'Не вдалося завантажити файл',
    )
  }

  return response.json() as Promise<ApiProjectMedia>
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export async function updateProject(
  projectId: number,
  payload: UpdateProjectPayload,
): Promise<CreatedProject> {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Не вдалося оновити проєкт')
  }

  return response.json() as Promise<CreatedProject>
}

export async function deleteProjectDocument(
  documentId: number,
): Promise<void> {
  const response = await apiFetch(`${API_URL}/documents/${documentId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося видалити документ',
    )
  }
}

export async function deleteProjectMedia(
  mediaId: number,
): Promise<void> {
  const response = await apiFetch(`${API_URL}/media/${mediaId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося видалити файл',
    )
  }
}

export type UpdateProjectContactPayload = {
  fullName?: string
  phone?: string
  role?: ApiContactRole
  position?: string
  isPrimary?: boolean
}

export async function updateProjectContact(
  contactId: number,
  payload: UpdateProjectContactPayload,
): Promise<ApiProjectContact> {
  const response = await apiFetch(`${API_URL}/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося оновити контакт',
    )
  }

  return response.json() as Promise<ApiProjectContact>
}

export async function deleteProjectContact(
  contactId: number,
): Promise<void> {
  const response = await apiFetch(`${API_URL}/contacts/${contactId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося видалити контакт',
    )
  }
}

export async function deleteProject(
  projectId: number,
): Promise<void> {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.message

    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || 'Не вдалося видалити проєкт',
    )
  }
}

export type CreateProjectTaskPayload = {
  title: string
  description?: string
  status?: ApiTaskStatus
  priority?: ApiTaskPriority
  dueDate?: string
}

export type UpdateProjectTaskPayload = {
  title?: string
  description?: string | null
  status?: ApiTaskStatus
  priority?: ApiTaskPriority
  dueDate?: string | null
}

function getErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body
  ) {
    const message = body.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string') {
      return message
    }
  }

  return fallback
}

export async function createProjectTask(
  projectId: number,
  payload: CreateProjectTaskPayload,
): Promise<ApiProjectTask> {
  const response = await apiFetch(
    `${API_URL}/projects/${projectId}/tasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      getErrorMessage(body, 'Не вдалося створити завдання'),
    )
  }

  return response.json() as Promise<ApiProjectTask>
}

export async function updateProjectTask(
  taskId: number,
  payload: UpdateProjectTaskPayload,
): Promise<ApiProjectTask> {
  const response = await apiFetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      getErrorMessage(body, 'Не вдалося оновити завдання'),
    )
  }

  return response.json() as Promise<ApiProjectTask>
}

export async function deleteProjectTask(
  taskId: number,
): Promise<void> {
  const response = await apiFetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      getErrorMessage(body, 'Не вдалося видалити завдання'),
    )
  }
}

export type ApiDashboardTask = {
  id: number
  projectId: number
  title: string
  description: string | null
  status: ApiTaskStatus
  priority: ApiTaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: number
    name: string
    status: ApiProjectStatus
    location: string | null
  }
}

export type ApiDashboardOverview = {
  metrics: {
    totalProjects: number
    activeProjects: number
    pendingTasks: number
    income: number
    expenses: number
    margin: number
  }
  upcomingTasks: ApiDashboardTask[]
}

export async function getDashboardOverview(): Promise<ApiDashboardOverview> {
  const response = await apiFetch(`${API_URL}/dashboard`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Не вдалося завантажити дашборд'

    throw new Error(message)
  }

  return response.json() as Promise<ApiDashboardOverview>
}

export type ApiGlobalTask = ApiProjectTask & {
project: {
id: number
name: string
status: ApiProjectStatus
location: string | null
}
}
export async function getAllTasks(): Promise<ApiGlobalTask[]> {
const response = await apiFetch(`${API_URL}/tasks`)

if (!response.ok) {
throw new Error('Не вдалося завантажити завдання')
}

return response.json() as Promise<ApiGlobalTask[]>
}

