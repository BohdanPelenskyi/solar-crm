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
    files: 2,
  },
}

async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)))
}

async function validateAttachments(attachments: Express.Multer.File[]) {
  if (attachments.length > 2) {
    await cleanupUploadedFiles(attachments)
    throw new BadRequestException('До однієї операції можна додати максимум 2 файли')
  }

  const invalidFile = attachments.find(
    (file) => !allowedAttachmentMimeTypes.has(file.mimetype),
  )

  if (invalidFile) {
    await cleanupUploadedFiles(attachments)
    throw new BadRequestException(
      'Дозволені PDF, DOC, DOCX, XLS, XLSX, JPG, PNG та WEBP',
    )
  }
}

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('projects/:projectId/transactions')
  @UseInterceptors(
    FilesInterceptor('attachments', 2, transactionAttachmentUploadOptions),
  )
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTransactionDto: CreateTransactionDto,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    await validateAttachments(attachments)

    return this.transactionsService.create(
      projectId,
      createTransactionDto,
      attachments,
    )
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
    FilesInterceptor('attachments', 2, transactionAttachmentUploadOptions),
  )
  async addAttachments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() attachments: Express.Multer.File[] = [],
  ) {
    await validateAttachments(attachments)

    return this.transactionsService.addAttachments(id, attachments)
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
