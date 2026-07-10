import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EquipmentStatus } from '../../generated/prisma/client';

export class CreateEquipmentDto {
  @IsString()
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}
