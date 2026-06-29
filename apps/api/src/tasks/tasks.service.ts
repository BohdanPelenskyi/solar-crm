import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      throw new NotFoundException(`Проєкт з ID ${projectId} не знайдено`)
    }
  }

  private async findTaskOrThrow(id: number) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id },
    })

    if (!task) {
      throw new NotFoundException(`Завдання з ID ${id} не знайдено`)
    }

    return task
  }

  async create(projectId: number, createTaskDto: CreateTaskDto) {
    await this.ensureProjectExists(projectId)

    return this.prisma.projectTask.create({
      data: {
        projectId,
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        priority: createTaskDto.priority,
        dueDate: createTaskDto.dueDate
          ? new Date(createTaskDto.dueDate)
          : undefined,
      },
    })
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId)

    return this.prisma.projectTask.findMany({
      where: { projectId },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  }
      async findAll() {
    return this.prisma.projectTask.findMany({
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
    ],
        include: {
        project: {
        select: {
        id: true,
        name: true,
        status: true,
        location: true,
      },
      },
    },
  })
  }
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    await this.findTaskOrThrow(id)

    const { dueDate, ...data } = updateTaskDto

    return this.prisma.projectTask.update({
      where: { id },
      data: {
        ...data,
        ...(dueDate !== undefined
          ? { dueDate: new Date(dueDate) }
          : {}),
      },
    })
  }

  async remove(id: number) {
    await this.findTaskOrThrow(id)

    await this.prisma.projectTask.delete({
      where: { id },
    })
  }
}