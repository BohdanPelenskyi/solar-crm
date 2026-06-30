import { useRef, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Star,
  Upload,
} from 'lucide-react'
import {
  getUploadUrl,
  uploadProjectDocument,
  type ApiProjectFile,
} from '../lib/api'
import { AttachmentDeleteButton } from './AttachmentDeleteButton'

type ProjectProposalProps = {
  projectId: number
  files: ApiProjectFile[]
  onChanged: () => Promise<void> | void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} КБ`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} МБ`
}

export function ProjectProposal({
  projectId,
  files,
  onChanged,
}: ProjectProposalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFinal, setIsFinal] = useState(false)
  const [error, setError] = useState('')

  const proposals = [...files]
    .filter((file) => file.category === 'PROPOSAL')
    .sort((first, second) => {
      if (first.isFinal !== second.isFinal) {
        return first.isFinal ? -1 : 1
      }

      return (
        new Date(second.uploadedAt).getTime() -
        new Date(first.uploadedAt).getTime()
      )
    })

  const finalProposal = proposals.find((file) => file.isFinal)
  const previousProposals = proposals.filter((file) => !file.isFinal)

  function resetForm() {
    setSelectedFile(null)
    setIsFinal(false)
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
      setError('Обери PDF-файл')
      return
    }

    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setError('Комерційна пропозиція має бути у форматі PDF')
      return
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('Максимальний розмір файлу — 15 МБ')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await uploadProjectDocument(
        projectId,
        selectedFile,
        'PROPOSAL',
        isFinal,
      )

      await onChanged()

      resetForm()
      setIsOpen(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося завантажити комерційну пропозицію',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Комерційна пропозиція
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            PDF-версії пропозицій для цього проєкту
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Upload size={17} />
          Додати PDF
        </button>
      </div>

      {finalProposal ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                <FileText size={20} />
              </span>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                  <CheckCircle2 size={13} />
                  Фінальна КП
                </span>

                <a
                  href={getUploadUrl(finalProposal.storageKey)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-1 truncate text-sm font-bold text-slate-900 hover:text-blue-700"
                >
                  <span className="truncate">
                    {finalProposal.originalName}
                  </span>
                  <ExternalLink size={15} className="shrink-0" />
                </a>

                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(finalProposal.uploadedAt)} ·{' '}
                  {formatFileSize(finalProposal.size)}
                </p>
              </div>
            </div>

            <AttachmentDeleteButton
              kind="document"
              id={finalProposal.id}
              onDeleted={onChanged}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
          <Star size={24} className="mx-auto text-amber-500" />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Фінальна комерційна пропозиція ще не визначена
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Завантаж PDF і відміть галочку «Фінальна».
          </p>
        </div>
      )}

      {previousProposals.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Інші версії
          </p>

          <div className="mt-3 space-y-2">
            {previousProposals.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
              >
                <FileText
                  size={18}
                  className="shrink-0 text-slate-400"
                />

                <a
                  href={getUploadUrl(file.storageKey)}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-slate-800 hover:text-blue-700">
                    {file.originalName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(file.uploadedAt)} ·{' '}
                    {formatFileSize(file.size)}
                  </p>
                </a>

                <AttachmentDeleteButton
                  kind="document"
                  id={file.id}
                  onDeleted={onChanged}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Завантажити комерційну пропозицію
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Доступний лише PDF-файл до 15 МБ.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  PDF-файл
                </span>

                <input
                  ref={inputRef}
                  required
                  type="file"
                  accept="application/pdf,.pdf"
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
                    </span>
                  </p>
                )}
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={isFinal}
                  onChange={(event) => setIsFinal(event.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Зробити основною фінальною КП
                  </span>

                  <span className="mt-1 block text-xs text-slate-600">
                    Попередня фінальна пропозиція залишиться в історії.
                  </span>
                </span>
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
                {isSaving ? 'Завантаження...' : 'Завантажити PDF'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}