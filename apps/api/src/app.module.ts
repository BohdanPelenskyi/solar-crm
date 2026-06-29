import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ContactsModule } from './contacts/contacts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FilesModule } from './files/files.module';
import { MediaModule } from './media/media.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [PrismaModule, ProjectsModule, ContactsModule, TransactionsModule, FilesModule, MediaModule, TasksModule],
  controllers: [AppController],
})
export class AppModule {}
