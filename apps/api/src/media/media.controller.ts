import {
  BadRequestException,
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
import { MediaType } from '../generated/prisma/client'
import { MediaService } from './media.service'

function getUploadsRoot() {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

function getMediaUploadsDirectory() {
  return join(getUploadsRoot(), 'media')
}

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence',
  'image/gif',
])

const videoMimeTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/3gpp',
  'video/mpeg',
])

const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.gif',
])

const videoExtensions = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.3gp',
  '.mpeg',
  '.mpg',
])

const mediaUploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const uploadDirectory = getMediaUploadsDirectory()
      mkdirSync(uploadDirectory, { recursive: true })
      callback(null, uploadDirectory)
    },

    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase()
      callback(null, `${randomUUID()}${extension}`)
    },
  }),

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
}

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('projects/:projectId/media')
  @UseInterceptors(FileInterceptor('file', mediaUploadOptions))
  async upload(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Оберіть фото або відео')
    }

    const extension = extname(file.originalname).toLowerCase()
    let type: MediaType

    if (
      imageMimeTypes.has(file.mimetype) ||
      file.mimetype.startsWith('image/') ||
      imageExtensions.has(extension)
    ) {
      type = MediaType.PHOTO
    } else if (
      videoMimeTypes.has(file.mimetype) ||
      file.mimetype.startsWith('video/') ||
      videoExtensions.has(extension)
    ) {
      type = MediaType.VIDEO
    } else {
      await unlink(file.path).catch(() => undefined)

      throw new BadRequestException(
        'Дозволені JPG, PNG, WEBP, HEIC, MP4, WEBM та MOV',
      )
    }

    return this.mediaService.create(projectId, file, type)
  }

  @Get('projects/:projectId/media')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.mediaService.findAllByProject(projectId)
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mediaService.remove(id)
  }
}