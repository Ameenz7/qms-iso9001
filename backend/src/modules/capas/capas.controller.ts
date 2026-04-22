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
import { CapasService } from './capas.service';
import { CreateCapaDto, UpdateCapaDto } from './dto/capa.dto';
import {
  CreateSubtaskDto,
  PromoteNcDto,
  UpdateFiveWhysDto,
  UpdateSubtaskDto,
} from './dto/subtask.dto';

@Controller('capas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CapasController {
  constructor(private readonly service: CapasService) {}

  @Get()
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Get('my-subtasks')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  mySubtasks(@CurrentUser() user: AuthenticatedUser) {
    return this.service.mySubtasks(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCapaDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCapaDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  // 5-Whys / Root cause
  @Patch(':id/five-whys')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  updateFiveWhys(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFiveWhysDto,
  ) {
    return this.service.updateFiveWhys(user, id, dto);
  }

  // Subtasks
  @Get(':id/subtasks')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  listSubtasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.listSubtasks(user, id);
  }

  @Post(':id/subtasks')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  createSubtask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.service.createSubtask(user, id, dto);
  }

  @Patch('subtasks/:subtaskId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER, Role.EMPLOYEE)
  updateSubtask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.service.updateSubtask(user, subtaskId, dto);
  }

  @Delete('subtasks/:subtaskId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  removeSubtask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.service.removeSubtask(user, subtaskId);
  }

  // Workflow
  @Post(':id/submit-for-validation')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.submitForValidation(user, id);
  }

  @Post(':id/validate')
  @Roles(Role.QUALITY_MANAGER)
  validate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.validate(user, id);
  }

  @Post(':id/reject')
  @Roles(Role.QUALITY_MANAGER)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.reject(user, id, body?.reason);
  }

  @Post(':id/reopen')
  @Roles(Role.QUALITY_MANAGER)
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.reopen(user, id, body?.reason);
  }

  // NC → CAPA promotion (under CAPA module for model cohesion; also exposed on NC)
  @Post('from-nc/:ncId')
  @Roles(Role.QUALITY_MANAGER, Role.ADMIN_OWNER)
  promoteFromNc(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ncId') ncId: string,
    @Body() dto: PromoteNcDto,
  ) {
    return this.service.promoteFromNc(user, ncId, dto);
  }
}
