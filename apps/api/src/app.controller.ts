import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const projectsCount = await this.prisma.project.count();

    return {
      status: 'ok',
      service: 'solar-crm-api',
      database: 'connected',
      projectsCount,
      timestamp: new Date().toISOString(),
    };
  }
}
