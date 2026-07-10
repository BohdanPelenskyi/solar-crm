import { Injectable, NotFoundException } from '@nestjs/common';
import { EquipmentStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Проєкт з ID ${projectId} не знайдено`);
    }
  }

  private async findEquipmentOrThrow(id: number) {
    const equipment = await this.prisma.projectEquipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException(`Обладнання з ID ${id} не знайдено`);
    }

    return equipment;
  }

  async create(projectId: number, createEquipmentDto: CreateEquipmentDto) {
    await this.ensureProjectExists(projectId);

    return this.prisma.projectEquipment.create({
      data: {
        projectId,
        name: createEquipmentDto.name.trim(),
        status: createEquipmentDto.status ?? EquipmentStatus.ORDERED,
      },
    });
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId);

    return this.prisma.projectEquipment.findMany({
      where: { projectId },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    await this.findEquipmentOrThrow(id);

    return this.prisma.projectEquipment.update({
      where: { id },
      data: {
        name: updateEquipmentDto.name?.trim(),
        status: updateEquipmentDto.status,
      },
    });
  }

  async remove(id: number) {
    await this.findEquipmentOrThrow(id);

    await this.prisma.projectEquipment.delete({
      where: { id },
    });
  }
}
