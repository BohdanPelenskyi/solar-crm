import { Injectable, NotFoundException } from '@nestjs/common'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { MediaType } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

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
    await this.ensureProjectExists(projectId)

    try {
      return await this.prisma.projectMedia.create({
        data: {
          projectId,
          type,
          originalName: uploadedFile.originalname,
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

    const absolutePath = join(
      process.cwd(),
      'uploads',
      media.storageKey,
    )

    await unlink(absolutePath).catch(() => undefined)
  }
}