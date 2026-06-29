import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator'
import { FileCategory } from '../../generated/prisma/client'

export class CreateFileDto {
  @IsEnum(FileCategory)
  category!: FileCategory

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isFinal?: boolean
}