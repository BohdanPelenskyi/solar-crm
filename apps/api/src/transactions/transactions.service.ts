import { Injectable, NotFoundException } from '@nestjs/common'
import { Buffer } from 'node:buffer'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { PaymentMethod, TransactionAttachmentType } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'

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
export class TransactionsService {
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

  private async findTransactionOrThrow(id: number) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: [
            { type: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })

    if (!transaction) {
      throw new NotFoundException(`Операцію з ID ${id} не знайдено`)
    }

    return transaction
  }

  private mapAttachment(
    file: Express.Multer.File,
    type: TransactionAttachmentType,
  ) {
    return {
      type,
      originalName: normalizeFileName(file.originalname),
      storageKey: `transactions/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    }
  }

  async create(
    projectId: number,
    createTransactionDto: CreateTransactionDto,
    attachments: Express.Multer.File[] = [],
    attachmentTypes: TransactionAttachmentType[] = [],
  ) {
    await this.ensureProjectExists(projectId)

    try {
      return await this.prisma.financialTransaction.create({
        data: {
          projectId,
          type: createTransactionDto.type,
          amount: createTransactionDto.amount,
          counterparty: createTransactionDto.counterparty,
          paymentMethod:
            createTransactionDto.paymentMethod ?? PaymentMethod.BANK_TRANSFER,
          accountName: createTransactionDto.accountName,
          occurredAt: new Date(createTransactionDto.occurredAt),
          comment: createTransactionDto.comment,
          attachments:
            attachments.length > 0
              ? {
                  create: attachments.map((file, index) =>
                    this.mapAttachment(
                      file,
                      attachmentTypes[index] ?? TransactionAttachmentType.INVOICE,
                    ),
                  ),
                }
              : undefined,
        },
        include: {
          attachments: {
            orderBy: [
              { type: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
      })
    } catch (error) {
      await Promise.all(
        attachments.map((file) => unlink(file.path).catch(() => undefined)),
      )

      throw error
    }
  }

  async addAttachments(
    transactionId: number,
    attachments: Express.Multer.File[] = [],
    attachmentType: TransactionAttachmentType,
  ) {
    const transaction = await this.findTransactionOrThrow(transactionId)

    if (attachments.length === 0) {
      return transaction
    }

    try {
      return await this.prisma.financialTransaction.update({
        where: { id: transactionId },
        data: {
          attachments: {
            create: attachments.map((file) =>
              this.mapAttachment(file, attachmentType),
            ),
          },
        },
        include: {
          attachments: {
            orderBy: [
              { type: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
      })
    } catch (error) {
      await Promise.all(
        attachments.map((file) => unlink(file.path).catch(() => undefined)),
      )

      throw error
    }
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId)

    return this.prisma.financialTransaction.findMany({
      where: { projectId },
      orderBy: {
        occurredAt: 'desc',
      },
      include: {
        attachments: {
          orderBy: [
            { type: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    await this.findTransactionOrThrow(id)

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        type: updateTransactionDto.type,
        amount: updateTransactionDto.amount,
        counterparty: updateTransactionDto.counterparty,
        paymentMethod: updateTransactionDto.paymentMethod,
        accountName: updateTransactionDto.accountName,
        occurredAt: updateTransactionDto.occurredAt
          ? new Date(updateTransactionDto.occurredAt)
          : undefined,
        comment: updateTransactionDto.comment,
      },
      include: {
        attachments: {
          orderBy: [
            { type: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })
  }

  async removeAttachment(id: number) {
    const attachment = await this.prisma.transactionAttachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      throw new NotFoundException(`Файл з ID ${id} не знайдено`)
    }

    await this.prisma.transactionAttachment.delete({
      where: { id },
    })

    await unlink(join(getUploadsRoot(), attachment.storageKey)).catch(
      () => undefined,
    )
  }

  async remove(id: number) {
    const transaction = await this.findTransactionOrThrow(id)

    await this.prisma.financialTransaction.delete({
      where: { id },
    })

    await Promise.all(
      transaction.attachments.map((attachment) =>
        unlink(join(getUploadsRoot(), attachment.storageKey)).catch(
          () => undefined,
        ),
      ),
    )
  }
}
