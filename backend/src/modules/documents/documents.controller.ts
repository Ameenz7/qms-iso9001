import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
