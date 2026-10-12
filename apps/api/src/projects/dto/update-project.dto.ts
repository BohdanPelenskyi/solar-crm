import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, [
    'contactFullName',
    'contactPhone',
    'contactRole',
    'contactPosition',
  ] as const),
) {}
