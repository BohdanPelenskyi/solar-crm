import { Injectable, NotFoundException } from '@nestjs/common'
import { Buffer } from 'node:buffer'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { MediaType } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

function hasCyrillic(value: string) {
  return /[А-Яа-яІіЇїЄєҐґ]/.test(value)
}

function hasReplacementCharacter(value: string) {
  return value.includes('�')
}

function decodeLatin1Mojibake(value: string) {
  try {
    return Buffer.from(value, 'latin1').toString('utf8')
  } catch {
    return value
  }
}

const windows1251SpecialMap = new Map<string, number>([
  ['\u0402', 0x80], ['\u0403', 0x81], ['\u201A', 0x82], ['\u0453', 0x83],
  ['\u201E', 0x84], ['\u2026', 0x85], ['\u2020', 0x86], ['\u2021', 0x87],
  ['\u20AC', 0x88], ['\u2030', 0x89], ['\u0409', 0x8a], ['\u2039', 0x8b],
  ['\u040A', 0x8c], ['\u040C', 0x8d], ['\u040B', 0x8e], ['\u040F', 0x8f],
  ['\u0452', 0x90], ['\u2018', 0x91], ['\u2019', 0x92], ['\u201C', 0x93],
  ['\u201D', 0x94], ['\u2022', 0x95], ['\u2013', 0x96], ['\u2014', 0x97],
  ['\u2122', 0x99], ['\u0459', 0x9a], ['\u203A', 0x9b], ['\u045A', 0x9c],
  ['\u045C', 0x9d], ['\u045B', 0x9e], ['\u045F', 0x9f], ['\u00A0', 0xa0],
  ['\u040E', 0xa1], ['\u045E', 0xa2], ['\u0408', 0xa3], ['\u00A4', 0xa4],
  ['\u0490', 0xa5], ['\u00A6', 0xa6], ['\u00A7', 0xa7], ['\u0401', 0xa8],
  ['\u00A9', 0xa9], ['\u0404', 0xaa], ['\u00AB', 0xab], ['\u00AC', 0xac],
  ['\u00AD', 0xad], ['\u00AE', 0xae], ['\u0407', 0xaf], ['\u00B0', 0xb0],
  ['\u00B1', 0xb1], ['\u0406', 0xb2], ['\u0456', 0xb3], ['\u0491', 0xb4],
  ['\u00B5', 0xb5], ['\u00B6', 0xb6], ['\u00B7', 0xb7], ['\u0451', 0xb8],
  ['\u2116', 0xb9], ['\u0454', 0xba], ['\u00BB', 0xbb], ['\u0458', 0xbc],
  ['\u0405', 0xbd], ['\u0455', 0xbe], ['\u0457', 0xbf],
])

function windows1251ByteForChar(character: string) {
  const code = character.charCodeAt(0)

  if (code <= 0x7f) {
    return code
  }

  if (code >= 0x0410 && code <= 0x044f) {
    return code - 0x0350
  }

  return windows1251SpecialMap.get(character)
}

function decodeWindows1251Mojibake(value: string) {
  const bytes: number[] = []

  for (const character of value) {
    const byte = windows1251ByteForChar(character)

    if (byte === undefined) {
      return value
    }

    bytes.push(byte)
  }

  try {
    return Buffer.from(bytes).toString('utf8')
  } catch {
    return value
  }
}

function normalizeFileName(fileName: string) {
  const latin1Decoded = decodeLatin1Mojibake(fileName)

  if (
    latin1Decoded !== fileName &&
    hasCyrillic(latin1Decoded) &&
    !hasReplacementCharacter(latin1Decoded)
  ) {
    return latin1Decoded
  }

  const windows1251Decoded = decodeWindows1251Mojibake(fileName)

  if (
    windows1251Decoded !== fileName &&
    hasCyrillic(windows1251Decoded) &&
    !hasReplacementCharacter(windows1251Decoded)
  ) {
    return windows1251Decoded
  }

  return fileName
}

function getUploadsRoot() {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      throw new NotFoundException(`Проєкт з ID ${projectId} не знайдено`)
    }
  }

  private async findMediaOrThrow(id: number) {
    const media = await this.prisma.projectMedia.findUnique({
      where: { id },
    })

    if (!media) {
      throw new NotFoundException(`Файл з ID ${id} не знайдено`)
    }

    return media
  }

  async create(
    projectId: number,
    uploadedFile: Express.Multer.File,
    type: MediaType,
  ) {
    try {
      await this.ensureProjectExists(projectId)

      return await this.prisma.projectMedia.create({
        data: {
          projectId,
          type,
          originalName: normalizeFileName(uploadedFile.originalname),
          storageKey: `media/${uploadedFile.filename}`,
          mimeType: uploadedFile.mimetype,
          size: uploadedFile.size,
        },
      })
    } catch (error) {
      await unlink(uploadedFile.path).catch(() => undefined)
      throw error
    }
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId)

    return this.prisma.projectMedia.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async remove(id: number) {
    const media = await this.findMediaOrThrow(id)

    await this.prisma.projectMedia.delete({
      where: { id },
    })

    const absolutePath = join(getUploadsRoot(), media.storageKey)

    await unlink(absolutePath).catch(() => undefined)
  }
}
