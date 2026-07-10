import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { RotateCcw, X } from 'lucide-react'

type UndoDeleteRequest = {
  message: string
  action: () => Promise<void> | void
  onCompleted?: () => Promise<void> | void
  onCancel?: () => void
  onError?: (error: unknown) => void
  durationMs?: number
}

type UndoDeleteItem = {
  id: string
  message: string
  createdAt: number
  expiresAt: number
  durationMs: number
  remainingMs: number
}

type UndoDeleteContextValue = {
  scheduleUndoDelete: (request: UndoDeleteRequest) => string
  cancelUndoDelete: (id: string) => void
}

const UndoDeleteContext =
  createContext<UndoDeleteContextValue | null>(null)

const defaultDurationMs = 5000

export function UndoDeleteProvider({
  children,
}: {
  children: ReactNode
}) {
  const [items, setItems] = useState<UndoDeleteItem[]>([])
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const cancelCallbacksRef = useRef(new Map<string, () => void>())

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    cancelCallbacksRef.current.delete(id)

    const timeout = timeoutsRef.current.get(id)

    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const cancelUndoDelete = useCallback(
    (id: string) => {
      const cancelCallback = cancelCallbacksRef.current.get(id)

      removeItem(id)
      cancelCallback?.()
    },
    [removeItem],
  )

  const scheduleUndoDelete = useCallback(
    (request: UndoDeleteRequest) => {
      const durationMs = request.durationMs ?? defaultDurationMs
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const createdAt = Date.now()
      const expiresAt = createdAt + durationMs

      setItems((current) => [
        ...current,
        {
          id,
          message: request.message,
          createdAt,
          expiresAt,
          durationMs,
          remainingMs: durationMs,
        },
      ])

      if (request.onCancel) {
        cancelCallbacksRef.current.set(id, request.onCancel)
      }

      const timeout = setTimeout(async () => {
        try {
          await request.action()
          await request.onCompleted?.()
        } catch (error) {
          request.onError?.(error)
        } finally {
          removeItem(id)
        }
      }, durationMs)

      timeoutsRef.current.set(id, timeout)

      return id
    },
    [removeItem],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      setItems((current) =>
        current.map((item) => ({
          ...item,
          remainingMs: Math.max(0, item.expiresAt - now),
        })),
      )
    }, 250)

    return () => {
      clearInterval(interval)

      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout)
      }

      timeoutsRef.current.clear()
      cancelCallbacksRef.current.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      scheduleUndoDelete,
      cancelUndoDelete,
    }),
    [scheduleUndoDelete, cancelUndoDelete],
  )

  return (
    <UndoDeleteContext.Provider value={value}>
      {children}

      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-[80] flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-[380px]">
          {items.map((item) => {
            const secondsLeft = Math.max(
              1,
              Math.ceil(item.remainingMs / 1000),
            )

            const progress = Math.max(
              0,
              Math.min(100, (item.remainingMs / item.durationMs) * 100),
            )

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <RotateCcw size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.message}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Видалення через {secondsLeft} с
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => cancelUndoDelete(item.id)}
                    className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Скасувати
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelUndoDelete(item.id)}
                    aria-label="Скасувати видалення"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="h-1 bg-slate-100">
                  <div
                    className="h-full bg-blue-600 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </UndoDeleteContext.Provider>
  )
}

export function useUndoDelete() {
  const context = useContext(UndoDeleteContext)

  if (!context) {
    throw new Error('useUndoDelete must be used inside UndoDeleteProvider')
  }

  return context
}
