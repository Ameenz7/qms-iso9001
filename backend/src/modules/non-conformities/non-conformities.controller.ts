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
import {
  CreateNonConformityDto,
  LinkCapaDto,
  UpdateNonConformityDto,
} from './dto/non-conformity.dto';
import { NonConformitiesService } from './non-conformities.service';

@Controller('non-conformities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NonConformitiesController {
  constructor(private readonly service: NonConformitiesService) {}

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
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNonConformityDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNonConformityDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Post(':id/link-capa')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  link(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LinkCapaDto,
  ) {
    return this.service.linkToCapa(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
