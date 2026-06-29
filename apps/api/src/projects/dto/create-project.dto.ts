import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { ProjectStatus } from '../../generated/prisma/client'

export class CreateProjectDto {
  @IsString()
  @MaxLength(180)
  name: string

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string
}