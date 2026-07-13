import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Star,
  Upload,
} from 'lucide-react'
import {
  getUploadUrl,
  setFinalProjectDocument,
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
  const [finalizingId, setFinalizingId] = useState<number | null>(null)
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

  function selectFile(file: File | null) {
    if (!file) {
      setSelectedFile(null)
      return
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setError('Комерційна пропозиція має бути у форматі PDF')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Максимальний розмір файлу — 15 МБ')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    selectFile(event.dataTransfer.files[0] ?? null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Обери PDF-файл')
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

  async function makeFinal(fileId: number) {
    try {
      setFinalizingId(fileId)
      await setFinalProjectDocument(fileId)
      await onChanged()
    } catch (requestError) {
      window.alert(
        requestError instanceof Error
          ? requestError.message
          : 'Не вдалося зробити КП фінальною',
      )
    } finally {
      setFinalizingId(null)
    }
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">
            Комерційна пропозиція
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Upload size={17} />
          Додати PDF
        </button>
      </div>

      {finalProposal ? (
        <div className="mt-4 max-w-full overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
              <FileText size={20} />
            </span>

            <div className="min-w-0 overflow-hidden">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                  <CheckCircle2 size={13} className="shrink-0" />
                  Фінальна КП
                </span>

                <a
                  href={getUploadUrl(finalProposal.storageKey)}
                  target="_blank"
                  rel="noreferrer"
                  title={finalProposal.originalName}
                  className="block min-w-0 flex-1 truncate text-sm font-bold text-slate-900 hover:text-blue-700"
                >
                  {finalProposal.originalName}
                </a>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {formatDate(finalProposal.uploadedAt)} ·{' '}
                {formatFileSize(finalProposal.size)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={getUploadUrl(finalProposal.storageKey)}
                target="_blank"
                rel="noreferrer"
                aria-label="Відкрити файл"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-blue-700"
              >
                <ExternalLink size={15} />
              </a>

              <AttachmentDeleteButton
                kind="document"
                id={finalProposal.id}
                onDeleted={onChanged}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
          <Star size={24} className="mx-auto text-amber-500" />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Фінальна комерційна пропозиція ще не визначена
          </p>
        </div>
      )}

      {previousProposals.length > 0 && (
        <div className="mt-5 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Інші версії
          </p>

          <div className="mt-3 space-y-2">
            {previousProposals.map((file) => (
              <div
                key={file.id}
                className="grid w-full max-w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl border border-slate-100 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
              >
                <FileText
                  size={18}
                  className="shrink-0 text-slate-400"
                />

                <a
                  href={getUploadUrl(file.storageKey)}
                  target="_blank"
                  rel="noreferrer"
                  title={file.originalName}
                  className="block min-w-0 max-w-full overflow-hidden"
                >
                  <p className="max-w-full overflow-hidden break-all text-sm font-semibold text-slate-800 hover:text-blue-700 sm:truncate sm:break-normal">
                    {file.originalName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(file.uploadedAt)} ·{' '}
                    {formatFileSize(file.size)}
                  </p>
                </a>

                <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 sm:col-span-1">
                  <button
                    type="button"
                    disabled={finalizingId === file.id}
                    onClick={() => void makeFinal(file.id)}
                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                  >
                    Фінальна
                  </button>

                  <AttachmentDeleteButton
                    kind="document"
                    id={file.id}
                    onDeleted={onChanged}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="my-4 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Завантажити комерційну пропозицію
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <span className="text-sm font-semibold text-slate-700">
                  PDF-файл
                </span>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="mt-1.5 cursor-pointer rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <Upload size={20} className="mx-auto text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Перетягни PDF або натисни
                  </p>
                </div>

                <input
                  ref={inputRef}
                  required
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    selectFile(event.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />

                {selectedFile && (
                  <div className="mt-3 flex min-w-0 flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:gap-2">
                    <FileText size={16} className="shrink-0 text-blue-600" />

                    <span
                      title={selectedFile.name}
                      className="min-w-0 flex-1 overflow-hidden break-all font-semibold sm:truncate sm:break-normal"
                    >
                      {selectedFile.name}
                    </span>

                    <span className="shrink-0 text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                )}
              </div>

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
                </span>
              </label>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
