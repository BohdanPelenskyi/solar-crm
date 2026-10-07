export type CompressImageOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
}

const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|heic|heif|bmp)$/i
const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|mov|m4v|3gp|quicktime)$/i

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true
  }

  return IMAGE_EXTENSION_REGEX.test(file.name)
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    return true
  }

  return VIDEO_EXTENSION_REGEX.test(file.name)
}

export function isMediaFile(file: File): boolean {
  return isImageFile(file) || isVideoFile(file)
}

/**
 * Optimizes an image file by resizing (if exceeds max dimensions)
 * and compressing to standard JPEG.
 * Converts iPhone HEIC photos into universally viewable JPEG format.
 * If conversion fails or browser cannot decode the format, returns the original file.
 */
export async function optimizeImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (!isImageFile(file)) {
    return file
  }

  const merged = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve) => {
    let objectUrl = ''

    try {
      objectUrl = URL.createObjectURL(file)
    } catch {
      resolve(file)
      return
    }

    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      try {
        let { width, height } = img

        if (width <= 0 || height <= 0) {
          resolve(file)
          return
        }

        if (width > merged.maxWidth || height > merged.maxHeight) {
          const ratio = Math.min(
            merged.maxWidth / width,
            merged.maxHeight / height,
          )
          width = Math.max(1, Math.round(width * ratio))
          height = Math.max(1, Math.round(height * ratio))
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Fill white background for transparent images when converting to JPEG
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '')
            const convertedName = `${baseName || 'photo'}.jpg`
            const optimizedFile = new File([blob], convertedName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(optimizedFile)
          },
          'image/jpeg',
          merged.quality,
        )
      } catch {
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback: return original file if Image loading fails
      resolve(file)
    }

    img.src = objectUrl
  })
}
