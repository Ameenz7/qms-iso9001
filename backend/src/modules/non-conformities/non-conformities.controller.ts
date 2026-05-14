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
  CreateCorrectiveActionDto,
  CreateNonConformityDto,
  CreateRootCauseDto,
  LinkCapaDto,
  UpdateCorrectiveActionDto,
  UpdateNonConformityDto,
  UpdateRootCauseDto,
} from './dto/non-conformity.dto';
import { NonConformitiesService } from './non-conformities.service';

@Controller('non-conformities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NonConformitiesController {
  constructor(private readonly service: NonConformitiesService) {}

  @Get()
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR, Role.EMPLOYEE)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR, Role.EMPLOYEE)
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

  // Root Cause endpoints
  @Post(':id/causes')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  addRootCause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRootCauseDto,
  ) {
    return this.service.addRootCause(user, id, dto);
  }

  @Patch(':id/causes/:causeId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  updateRootCause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('causeId') causeId: string,
    @Body() dto: UpdateRootCauseDto,
  ) {
    return this.service.updateRootCause(user, id, causeId, dto);
  }

  @Delete(':id/causes/:causeId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  deleteRootCause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('causeId') causeId: string,
  ) {
    return this.service.deleteRootCause(user, id, causeId);
  }

  // Corrective Action endpoints
  @Post(':id/actions')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  addAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCorrectiveActionDto,
  ) {
    return this.service.addAction(user, id, dto);
  }

  @Patch(':id/actions/:actionId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER, Role.EMPLOYEE)
  updateAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Body() dto: UpdateCorrectiveActionDto,
  ) {
    return this.service.updateAction(user, id, actionId, dto);
  }

  @Delete(':id/actions/:actionId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  deleteAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('actionId') actionId: string,
  ) {
    return this.service.deleteAction(user, id, actionId);
  }
}
