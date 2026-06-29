import { useRef, useState, type FormEvent } from 'react'
import { Upload } from 'lucide-react'
import { uploadProjectMedia } from '../lib/api'

type CreateMediaPanelProps = {
  projectId: number
  onCreated: () => Promise<void> | void
}

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

function formatFileSize(bytes: number) {
  return new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits: 1,
  }).format(bytes / 1024 / 1024)
}

export function CreateMediaPanel({
  projectId,
  onCreated,
}: CreateMediaPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function resetForm() {
    setSelectedFile(null)
    setError('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function closeModal() {
    if (isSaving) {
      return
    }

    resetForm()
    setIsOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Спочатку вибери фото або відео')
      return
    }

    if (!allowedMimeTypes.has(selectedFile.type)) {
      setError('Дозволені JPG, PNG, WEBP, MP4, WEBM та MOV')
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Максимальний розмір файлу — 50 МБ')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await uploadProjectMedia(projectId, selectedFile)
      await onCreated()

      resetForm()
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося завантажити файл',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
      >
        <Upload size={17} />
        Додати файли
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Завантажити фото або відео
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              JPG, PNG, WEBP, MP4, WEBM або MOV до 50 МБ
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Файл
                </span>

                <input
                  ref={inputRef}
                  required
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />

                {selectedFile && (
                  <p className="mt-2 text-sm text-slate-600">
                    Обрано:{' '}
                    <span className="font-semibold">
                      {selectedFile.name}
                    </span>{' '}
                    · {formatFileSize(selectedFile.size)} МБ
                  </p>
                )}
              </label>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Скасувати
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? 'Завантаження...' : 'Завантажити'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}