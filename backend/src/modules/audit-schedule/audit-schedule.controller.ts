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
import { AuditScheduleService } from './audit-schedule.service';
import {
  CreateAuditScheduleDto,
  CreateFindingDto,
  UpdateAuditScheduleDto,
  UpdateChecklistItemDto,
} from './dto/audit-schedule.dto';

@Controller('audit-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditScheduleController {
  constructor(private readonly service: AuditScheduleService) {}

  @Get()
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAuditScheduleDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAuditScheduleDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  @Patch('checklist-items/:itemId')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  updateChecklistItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.service.updateChecklistItem(user, itemId, dto);
  }

  @Post(':id/findings')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  addFinding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateFindingDto,
  ) {
    return this.service.addFinding(user, id, dto);
  }

  @Post('findings/:findingId/close')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  closeFinding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('findingId') findingId: string,
  ) {
    return this.service.closeFinding(user, findingId);
  }
}
