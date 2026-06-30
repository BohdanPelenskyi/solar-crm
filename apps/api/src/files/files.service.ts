import { Injectable, NotFoundException } from '@nestjs/common'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { FileCategory } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFileDto } from './dto/create-file.dto'

@Injectable()
export class FilesService {
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

  private async findFileOrThrow(id: number) {
    const file = await this.prisma.projectFile.findUnique({
      where: { id },
    })

    if (!file) {
      throw new NotFoundException(`Документ з ID ${id} не знайдено`)
    }

    return file
  }

  async createDocument(
    projectId: number,
    createFileDto: CreateFileDto,
    uploadedFile: Express.Multer.File,
  ) {
    await this.ensureProjectExists(projectId)

    const isFinalProposal =
      createFileDto.category === FileCategory.PROPOSAL &&
      createFileDto.isFinal === true

    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (isFinalProposal) {
          await transaction.projectFile.updateMany({
            where: {
              projectId,
              category: FileCategory.PROPOSAL,
              isFinal: true,
            },
            data: {
              isFinal: false,
            },
          })
        }

        return transaction.projectFile.create({
          data: {
            projectId,
            category: createFileDto.category,
            originalName: uploadedFile.originalname,
            storageKey: `documents/${uploadedFile.filename}`,
            mimeType: uploadedFile.mimetype,
            size: uploadedFile.size,
            isFinal: isFinalProposal,
          },
        })
      })
    } catch (error) {
      await unlink(uploadedFile.path).catch(() => undefined)
      throw error
    }
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId)

    return this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: [
        { isFinal: 'desc' },
        { uploadedAt: 'desc' },
      ],
    })
  }

  async remove(id: number) {
    const file = await this.findFileOrThrow(id)

    await this.prisma.projectFile.delete({
      where: { id },
    })

    const absolutePath = join(
      process.cwd(),
      'uploads',
      file.storageKey,
    )

    await unlink(absolutePath).catch(() => undefined)
  }
}