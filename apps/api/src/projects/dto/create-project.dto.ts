import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactRole, ProjectStatus } from '../../generated/prisma/client';

export class CreateProjectDto {
  @IsString()
  @MaxLength(180)
  name: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactFullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsEnum(ContactRole)
  contactRole?: ContactRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPosition?: string;
}
