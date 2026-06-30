import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { UserRole } from '../generated/prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName =
    process.env.ADMIN_FULL_NAME?.trim() || 'Адміністратор Solar CRM';

  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script',
    );
  }

  if (password.length < 12) {
    throw new Error('Admin password must contain at least 12 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const prisma = app.get(PrismaService);

  try {
    const passwordHash = await hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        email,
        fullName,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.log(`Admin account is ready: ${user.email}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
