import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { diskStorage } from 'multer'
import { TransactionAttachmentType } from '../generated/prisma/client'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { TransactionsService } from './transactions.service'

function getUploadsRoot() {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

function getTransactionUploadsDirectory() {
  return join(getUploadsRoot(), 'transactions')
}

const allowedAttachmentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence',
])

const allowedAttachmentExtensions = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
])

const allowedAttachmentTypes = new Set<string>([
  TransactionAttachmentType.INVOICE,
  TransactionAttachmentType.EXPENSE_DOC,
])

const transactionAttachmentUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const uploadDirectory = getTransactionUploadsDirectory()
      mkdirSync(uploadDirectory, { recursive: true })
      callback(null, uploadDirectory)
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase()
      callback(null, `${randomUUID()}${extension}`)
    },
  }),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
}

async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)))
}

async function validateAttachments(attachments: Express.Multer.File[]) {
  const invalidFile = attachments.find((file) => {
    const ext = extname(file.originalname).toLowerCase()
    return !allowedAttachmentMimeTypes.has(file.mimetype) && !allowedAttachmentExtensions.has(ext)
  })

  if (invalidFile) {
    await cleanupUploadedFiles(attachments)
    throw new BadRequestException(
      'Дозволені PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP та HEIC',
    )
  }
}

function normalizeAttachmentType(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  if (!allowedAttachmentTypes.has(value)) {
    return undefined
  }

  return value as TransactionAttachmentType
}

function normalizeAttachmentTypes(
  value: unknown,
  filesCount: number,
): TransactionAttachmentType[] {
  if (filesCount === 0) {
    return []
  }

  const rawValues = Array.isArray(value)
    ? value
    : value === undefined
      ? []
      : [value]

  if (rawValues.length === 0) {
    return Array.from(
      { length: filesCount },
      () => TransactionAttachmentType.INVOICE,
    )
  }

  if (rawValues.length !== filesCount) {
    throw new BadRequestException(
      'Кількість типів файлів не збігається з кількістю файлів',
    )
  }

  return rawValues.map((rawValue) => {
    const attachmentType = normalizeAttachmentType(rawValue)

    if (!attachmentType) {
      throw new BadRequestException('Некоректний тип фінансового документа')
    }

    return attachmentType
  })
}

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('projects/:projectId/transactions')
  @UseInterceptors(
    FilesInterceptor('attachments', undefined, transactionAttachmentUploadOptions),
  )
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTransactionDto: CreateTransactionDto,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    try {
      await validateAttachments(attachments)

      const attachmentTypes = normalizeAttachmentTypes(
        createTransactionDto.attachmentTypes,
        attachments.length,
      )

      return await this.transactionsService.create(
        projectId,
        createTransactionDto,
        attachments,
        attachmentTypes,
      )
    } catch (error) {
      await cleanupUploadedFiles(attachments)
      throw error
    }
  }

  @Get('projects/:projectId/transactions')
  findAllByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.transactionsService.findAllByProject(projectId)
  }

  @Patch('transactions/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto)
  }

  @Post('transactions/:id/attachments')
  @UseInterceptors(
    FilesInterceptor('attachments', undefined, transactionAttachmentUploadOptions),
  )
  async addAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Body('attachmentType') attachmentTypeValue: string | undefined,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    try {
      await validateAttachments(attachments)

      const attachmentType = normalizeAttachmentType(attachmentTypeValue)

      if (!attachmentType) {
        throw new BadRequestException('Некоректний тип фінансового документа')
      }

      return await this.transactionsService.addAttachments(
        id,
        attachments,
        attachmentType,
      )
    } catch (error) {
      await cleanupUploadedFiles(attachments)
      throw error
    }
  }

  @Delete('transaction-attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAttachment(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.removeAttachment(id)
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id)
  }
}
