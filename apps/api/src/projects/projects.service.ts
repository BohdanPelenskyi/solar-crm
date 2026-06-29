import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        contacts: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        _count: {
          select: {
            contacts: true,
            transactions: true,
            files: true,
            media: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
      include: {
        contacts: {
          orderBy: [
            {
              isPrimary: 'desc',
            },
            {
              createdAt: 'asc',
            },
          ],
        },
        transactions: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
        files: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        media: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Проєкт з ID ${id} не знайдено`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    return this.prisma.project.update({
      where: {
        id,
      },
      data: updateProjectDto,
    });
  }

async remove(id: number) {
  const project = await this.prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      files: {
        select: {
          storageKey: true,
        },
      },
      media: {
        select: {
          storageKey: true,
        },
      },
    },
  })

  if (!project) {
    throw new NotFoundException(`Проєкт з ID ${id} не знайдено`)
  }

  const storageKeys = [
    ...project.files.map((file) => file.storageKey),
    ...project.media.map((media) => media.storageKey),
  ]

  await this.prisma.$transaction(async (tx) => {
    await tx.projectContact.deleteMany({
      where: { projectId: id },
    })

    await tx.financialTransaction.deleteMany({
      where: { projectId: id },
    })

    await tx.projectFile.deleteMany({
      where: { projectId: id },
    })

    await tx.projectMedia.deleteMany({
      where: { projectId: id },
    })

    await tx.project.delete({
      where: { id },
    })
  })

  await Promise.all(
    storageKeys.map((storageKey) =>
      unlink(join(process.cwd(), 'uploads', storageKey)).catch(
        () => undefined,
      ),
    ),
  )

  return {
    message: 'Проєкт видалено',
  }
}