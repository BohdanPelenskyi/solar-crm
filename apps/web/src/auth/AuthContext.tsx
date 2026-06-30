import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  login as requestLogin,
  setAccessToken,
  type ApiAuthenticatedUser,
} from '../lib/api'

type AuthContextValue = {
  user: ApiAuthenticatedUser | null
  isInitializing: boolean
  canAdd: boolean
  canManage: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<ApiAuthenticatedUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const token = getAccessToken()

      if (!token) {
        if (isMounted) {
          setIsInitializing(false)
        }

        return
      }

      try {
        const currentUser = await getCurrentUser()

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        clearAccessToken()
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email: string, password: string) {
    const result = await requestLogin(email, password)

    setAccessToken(result.accessToken)
    setUser(result.user)
  }

  function logout() {
    clearAccessToken()
    setUser(null)
  }

  const canAdd =
    user?.role === 'ADMIN' || user?.role === 'WORKER'

  const canManage = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitializing,
        canAdd,
        canManage,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
