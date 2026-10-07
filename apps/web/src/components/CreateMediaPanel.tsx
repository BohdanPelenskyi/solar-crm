import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { uploadProjectMedia } from '../lib/api'
import { isImageFile, isMediaFile, optimizeImageFile } from '../lib/imageOptimization'

type CreateMediaPanelProps = {
  projectId: number
  onCreated: () => Promise<void> | void
}

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
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function resetForm() {
    setSelectedFiles([])
    setError('')
    setStatusMessage('')

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

  function handleFilesSelect(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    const filesArray = Array.from(fileList)
    const validFiles: File[] = []
    let hasInvalid = false
    let hasTooLarge = false

    for (const file of filesArray) {
      if (!isMediaFile(file)) {
        hasInvalid = true
        continue
      }

      if (file.size > 50 * 1024 * 1024) {
        hasTooLarge = true
        continue
      }

      validFiles.push(file)
    }

    if (hasInvalid) {
      setError('Підтримуються формати фото (JPG, PNG, WEBP, HEIC) та відео (MP4, MOV)')
    } else if (hasTooLarge) {
      setError('Максимальний розмір одного файлу — 50 МБ')
    } else {
      setError('')
    }

    if (validFiles.length > 0) {
      setSelectedFiles((current) => [...current, ...validFiles])
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((current) => current.filter((_, i) => i !== index))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    handleFilesSelect(event.dataTransfer.files)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedFiles.length === 0) {
      setError('Спочатку виберіть хоча б одне фото або відео')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      for (let i = 0; i < selectedFiles.length; i++) {
        const originalFile = selectedFiles[i]
        const currentNum = i + 1
        const total = selectedFiles.length

        if (isImageFile(originalFile)) {
          setStatusMessage(
            total > 1
              ? `Оптимізація та завантаження фото (${currentNum}/${total})...`
              : 'Оптимізація та завантаження фото...',
          )
        } else {
          setStatusMessage(
            total > 1
              ? `Завантаження відео (${currentNum}/${total})...`
              : 'Завантаження відео...',
          )
        }

        // Optimize image on client side (converts HEIC, resizes to max 2048px, reduces size)
        const fileToUpload = await optimizeImageFile(originalFile)

        await uploadProjectMedia(projectId, fileToUpload)
      }

      await onCreated()

      resetForm()
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося завантажити медіа',
      )
    } finally {
      setIsSaving(false)
      setStatusMessage('')
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Завантажити фото або відео
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <span className="text-sm font-semibold text-slate-700">
                  Виберіть файли
                </span>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="mt-1.5 cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <Upload size={24} className="mx-auto text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Натисніть для вибору з галереї або камери
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Можна вибрати кілька фото одночасно
                  </p>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.heic,.heif"
                  onChange={(event) => {
                    handleFilesSelect(event.target.files)
                    if (event.target) {
                      event.target.value = ''
                    }
                  }}
                  className="hidden"
                />

                {selectedFiles.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText size={16} className="shrink-0 text-blue-600" />
                          <span className="min-w-0 truncate font-semibold">
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatFileSize(file.size)} МБ
                          </span>
                        </div>

                        {!isSaving && (
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            title="Видалити"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

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
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Скасувати
              </button>

              <button
                type="submit"
                disabled={isSaving || selectedFiles.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {isSaving ? 'Завантаження...' : `Завантажити (${selectedFiles.length})`}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
