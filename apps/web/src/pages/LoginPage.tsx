import {
  useState,
  type FormEvent,
} from 'react'
import {
  LogIn,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
} from 'react-router'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, isInitializing, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-slate-500">
          Завантаження...
        </p>
      </main>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')

      await login(email.trim(), password)

      navigate('/dashboard', {
        replace: true,
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося виконати вхід',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sun size={25} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SOLAR CRM
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Вхід до робочого кабінету
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-blue-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck
              size={20}
              className="shrink-0 text-blue-600"
            />

            <p className="text-sm leading-6 text-blue-800">
              Доступ до проєктів, фінансів, документів і завдань
              мають лише авторизовані користувачі.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Email
            </span>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@solar.crm"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Пароль
            </span>

            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введи пароль"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {isSubmitting ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
      </section>
    </main>
  )
}