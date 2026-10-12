import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { getUploadsRoot } from './common/uploads'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useStaticAssets(getUploadsRoot(), {
    prefix: '/uploads/',
  })

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}

bootstrap()