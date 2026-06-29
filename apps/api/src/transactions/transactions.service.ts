import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, TransactionType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
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

  private async findTransactionOrThrow(id: number) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Операцію з ID ${id} не знайдено`);
    }

    return transaction;
  }

  async create(projectId: number, createTransactionDto: CreateTransactionDto) {
    await this.ensureProjectExists(projectId);

    return this.prisma.financialTransaction.create({
      data: {
        projectId,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        counterparty: createTransactionDto.counterparty,
        paymentMethod:
          createTransactionDto.paymentMethod ?? PaymentMethod.BANK_TRANSFER,
        accountName: createTransactionDto.accountName,
        occurredAt: new Date(createTransactionDto.occurredAt),
        comment: createTransactionDto.comment,
      },
    });
  }

  async findAllByProject(projectId: number) {
    await this.ensureProjectExists(projectId);

    return this.prisma.financialTransaction.findMany({
      where: { projectId },
      orderBy: {
        occurredAt: 'desc',
      },
    });
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    await this.findTransactionOrThrow(id);

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        type: updateTransactionDto.type,
        amount: updateTransactionDto.amount,
        counterparty: updateTransactionDto.counterparty,
        paymentMethod: updateTransactionDto.paymentMethod,
        accountName: updateTransactionDto.accountName,
        occurredAt: updateTransactionDto.occurredAt
          ? new Date(updateTransactionDto.occurredAt)
          : undefined,
        comment: updateTransactionDto.comment,
      },
    });
  }

  async remove(id: number) {
    await this.findTransactionOrThrow(id);

    await this.prisma.financialTransaction.delete({
      where: { id },
    });
  }
}
