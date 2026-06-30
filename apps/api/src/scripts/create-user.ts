import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { UserRole } from '../generated/prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const email = process.env.USER_EMAIL?.trim().toLowerCase();
  const password = process.env.USER_PASSWORD;
  const fullName = process.env.USER_FULL_NAME?.trim();
  const roleValue = process.env.USER_ROLE?.trim().toUpperCase();

  if (!email || !password || !fullName || !roleValue) {
    throw new Error(
      'Set USER_EMAIL, USER_PASSWORD, USER_FULL_NAME and USER_ROLE before running this script',
    );
  }

  if (password.length < 12) {
    throw new Error('Password must contain at least 12 characters');
  }

  if (!Object.values(UserRole).includes(roleValue as UserRole)) {
    throw new Error(
      `Unknown role "${roleValue}". Available roles: ${Object.values(UserRole).join(', ')}`,
    );
  }

  const role = roleValue as UserRole;

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
        role,
        isActive: true,
      },
      create: {
        email,
        fullName,
        passwordHash,
        role,
      },
    });

    console.log(`User account is ready: ${user.email} (${user.role})`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
