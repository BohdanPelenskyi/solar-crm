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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('projects/:projectId/transactions')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(projectId, createTransactionDto);
  }

  @Get('projects/:projectId/transactions')
  findAllByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.transactionsService.findAllByProject(projectId);
  }

  @Patch('transactions/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id);
  }
}
