import {
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
} from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post('projects/:projectId/equipment')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createEquipmentDto: CreateEquipmentDto,
  ) {
    return this.equipmentService.create(projectId, createEquipmentDto);
  }

  @Get('projects/:projectId/equipment')
  findAllByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.equipmentService.findAllByProject(projectId);
  }

  @Patch('equipment/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete('equipment/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.equipmentService.remove(id);
  }
}
