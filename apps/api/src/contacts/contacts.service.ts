import { Injectable, NotFoundException } from '@nestjs/common'
import { ContactRole } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'

@Injectable()
export class ContactsService {
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

  private async findContactOrThrow(id: number) {
    const contact = await this.prisma.projectContact.findUnique({
      where: { id },
    })

    if (!contact) {
      throw new NotFoundException(`Контакт з ID ${id} не знайдено`)
    }

    return contact
  }

  async create(projectId: number, createContactDto: CreateContactDto) {
    await this.ensureProjectExists(projectId)

    return this.prisma.$transaction(async (tx) => {
      const contactsCount = await tx.projectContact.count({
        where: { projectId },
      })

      const isPrimary =
        createContactDto.isPrimary ?? contactsCount === 0

      if (isPrimary) {
        await tx.projectContact.updateMany({
          where: {
            projectId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        })
      }

      return tx.projectContact.create({
        data: {
          projectId,
          fullName: createContactDto.fullName,
          phone: createContactDto.phone,
          role: createContactDto.role ?? ContactRole.OTHER,
          position: createContactDto.position,
          isPrimary,
        },
      })
    })
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId)

    return this.prisma.projectContact.findMany({
      where: { projectId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    })
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    const contact = await this.findContactOrThrow(id)

    return this.prisma.$transaction(async (tx) => {
      if (updateContactDto.isPrimary === true) {
        await tx.projectContact.updateMany({
          where: {
            projectId: contact.projectId,
            isPrimary: true,
            id: { not: id },
          },
          data: {
            isPrimary: false,
          },
        })
      }

      return tx.projectContact.update({
        where: { id },
        data: updateContactDto,
      })
    })
  }

  async remove(id: number) {
    const contact = await this.findContactOrThrow(id)

    await this.prisma.$transaction(async (tx) => {
      await tx.projectContact.delete({
        where: { id },
      })

      if (contact.isPrimary) {
        const nextContact = await tx.projectContact.findFirst({
          where: {
            projectId: contact.projectId,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        if (nextContact) {
          await tx.projectContact.update({
            where: { id: nextContact.id },
            data: { isPrimary: true },
          })
        }
      }
    })
  }
}