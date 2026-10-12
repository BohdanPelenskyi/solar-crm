import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export function getUploadsRoot() {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

export async function removeStoredFiles(storageKeys: string[]) {
  const root = getUploadsRoot()

  await Promise.all(
    storageKeys.map((storageKey) =>
      unlink(join(root, storageKey)).catch(() => undefined),
    ),
  )
}
