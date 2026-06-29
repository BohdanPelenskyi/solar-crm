import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { PrismaModule } from './prisma/prisma.module'
import { ProjectsModule } from './projects/projects.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [PrismaModule, ProjectsModule, ContactsModule],
  controllers: [AppController],
})
export class AppModule {}