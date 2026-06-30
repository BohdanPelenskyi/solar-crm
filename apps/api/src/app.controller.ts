import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
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
