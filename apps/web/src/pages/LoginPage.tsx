import {
  useState,
  type FormEvent,
} from 'react'
import {
  LogIn,
  ShieldCheck,
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
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-5">
      <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <img
            src="/leo-energy-logo.png"
            alt="Leo Energy"
            className="h-auto w-52 object-contain sm:w-60"
          />
          
          <p className="mt-1 text-sm text-slate-500">
            Вхід до робочого кабінету
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-blue-50 p-4 sm:mt-7">
          <div className="flex gap-3 text-left">
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
              placeholder="admin@leo.energy"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none transition focus:border-blue-500 sm:text-sm"
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
              className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none transition focus:border-blue-500 sm:text-sm"
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {isSubmitting ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
      </section>
    </main>
  )
}