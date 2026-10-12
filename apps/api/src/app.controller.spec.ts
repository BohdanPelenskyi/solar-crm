import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: { project: { count: () => Promise.resolve(3) } },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('reports the database connection and projects count', async () => {
      const result = await appController.health();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.projectsCount).toBe(3);
    });
  });
});
