import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { removeStoredFiles } from '../common/uploads';
import { ContactRole } from '../generated/prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const {
      contactFullName,
      contactPhone,
      contactRole,
      contactPosition,
      ...projectData
    } = createProjectDto;

    const fullName = contactFullName?.trim();
    const phone = contactPhone?.trim();
    const position = contactPosition?.trim();

    if (Boolean(fullName) !== Boolean(phone)) {
      throw new BadRequestException(
        'Для контакту потрібно вказати і ПІБ, і телефон',
      );
    }

    return this.prisma.project.create({
      data: {
        ...projectData,
        contacts:
          fullName && phone
            ? {
                create: {
                  fullName,
                  phone,
                  role: contactRole ?? ContactRole.OWNER,
                  position: position || undefined,
                  isPrimary: true,
                },
              }
            : undefined,
      },
    });
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      // Stable order by creation: editing a project must not move it in the list.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        contacts: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    return projects.map(({ transactions, ...project }) => {
      const income = transactions
        .filter((transaction) => transaction.type === 'INCOME')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      const expenses = transactions
        .filter((transaction) => transaction.type === 'EXPENSE')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      return {
        ...project,
        financialSummary: {
          income,
          expenses,
          margin: income - expenses,
          transactionsCount: transactions.length,
        },
      };
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
          include: {
            attachments: {
              orderBy: {
                createdAt: 'asc',
              },
            },
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
        tasks: {
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        equipment: {
          orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' },
          ],
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

    const { name, status, ...optionalFields } = updateProjectDto;
    const data: Record<string, string | null | undefined> = {};

    // Optional text fields: null or an empty string clears the value.
    for (const [key, value] of Object.entries(optionalFields)) {
      if (value === undefined) {
        continue;
      }

      data[key] = value === null || value.trim() === '' ? null : value.trim();
    }

    return this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(status ? { status } : {}),
      },
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
        transactions: {
          select: {
            attachments: {
              select: {
                storageKey: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Проєкт з ID ${id} не знайдено`);
    }

    const storageKeys = [
      ...project.files.map((file) => file.storageKey),
      ...project.media.map((media) => media.storageKey),
      ...project.transactions.flatMap((transaction) =>
        transaction.attachments.map((attachment) => attachment.storageKey),
      ),
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.projectContact.deleteMany({
        where: { projectId: id },
      });

      await tx.financialTransaction.deleteMany({
        where: { projectId: id },
      });

      await tx.projectFile.deleteMany({
        where: { projectId: id },
      });

      await tx.projectMedia.deleteMany({
        where: { projectId: id },
      });

      await tx.project.delete({
        where: { id },
      });
    });

    await removeStoredFiles(storageKeys);

    return {
      message: 'Проєкт видалено',
    };
  }
}
