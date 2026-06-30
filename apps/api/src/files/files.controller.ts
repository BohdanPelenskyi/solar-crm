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
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { diskStorage } from 'multer'
import { FileCategory } from '../generated/prisma/client'
import { CreateFileDto } from './dto/create-file.dto'
import { FilesService } from './files.service'

const uploadDirectory = join(process.cwd(), 'uploads', 'documents')

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const documentUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
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

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('projects/:projectId/documents')
  @UseInterceptors(
    FileInterceptor('file', documentUploadOptions),
  )
  async uploadDocument(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createFileDto: CreateFileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Оберіть файл для завантаження')
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      await unlink(file.path).catch(() => undefined)

      throw new BadRequestException(
        'Дозволені PDF, DOC, DOCX, XLS, XLSX, JPG, PNG та WEBP',
      )
    }

    if (
      createFileDto.category === FileCategory.PROPOSAL &&
      file.mimetype !== 'application/pdf'
    ) {
      await unlink(file.path).catch(() => undefined)

      throw new BadRequestException(
        'Комерційна пропозиція має бути у форматі PDF',
      )
    }

    return this.filesService.createDocument(
      projectId,
      createFileDto,
      file,
    )
  }

  @Get('projects/:projectId/documents')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.filesService.findAllByProject(projectId)
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.filesService.remove(id)
  }
}