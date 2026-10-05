import { Injectable } from '@nestjs/common'
import {
  ProjectStatus,
  TaskStatus,
  TransactionType,
} from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const inactiveProjectStatuses = [
      ProjectStatus.COMPLETED,
      ProjectStatus.REFUSED,
      ProjectStatus.NO_LONGER_RELEVANT,
    ]

    const [
      totalProjects,
      activeProjects,
      incomeResult,
      expenseResult,
      pendingTasks,
      upcomingTasks,
    ] = await Promise.all([
      this.prisma.project.count(),

      this.prisma.project.count({
        where: {
          status: {
            notIn: inactiveProjectStatuses,
          },
        },
      }),

      this.prisma.financialTransaction.aggregate({
        where: {
          type: TransactionType.INCOME,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.financialTransaction.aggregate({
        where: {
          type: TransactionType.EXPENSE,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.projectTask.count({
        where: {
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
          },
        },
      }),

      this.prisma.projectTask.findMany({
        where: {
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
          },
          dueDate: {
            not: null,
          },
        },
        orderBy: [
          {
            dueDate: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        take: 8,
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
      }),
    ])

    const income = Number(incomeResult._sum.amount ?? 0)
    const expenses = Number(expenseResult._sum.amount ?? 0)

    return {
      metrics: {
        totalProjects,
        activeProjects,
        pendingTasks,
        income,
        expenses,
        margin: income - expenses,
      },

      upcomingTasks,
    }
  }
}