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
} from '@nestjs/common'
import { ContactsService } from './contacts.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'

@Controller()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('projects/:projectId/contacts')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.contactsService.create(projectId, createContactDto)
  }

  @Get('projects/:projectId/contacts')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.contactsService.findAllByProject(projectId)
  }

  @Patch('contacts/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, updateContactDto)
  }

  @Delete('contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactsService.remove(id)
  }
}