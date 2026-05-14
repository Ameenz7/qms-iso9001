import {
  Body,
  Controller,
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
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('account')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN_OWNER,
    Role.QUALITY_MANAGER,
    Role.AUDITOR,
    Role.EMPLOYEE,
  )
  getAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getAccount(user);
  }

  @Patch('account')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN_OWNER,
    Role.QUALITY_MANAGER,
    Role.AUDITOR,
    Role.EMPLOYEE,
  )
  updateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { firstName?: string; lastName?: string },
  ) {
    return this.service.updateAccount(user, dto);
  }

  @Post('account/change-password')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN_OWNER,
    Role.QUALITY_MANAGER,
    Role.AUDITOR,
    Role.EMPLOYEE,
  )
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.service.changePassword(user, dto);
  }

  @Get('org')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR, Role.EMPLOYEE)
  getOrgSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOrgSettings(user);
  }

  @Patch('org')
  @Roles(Role.ADMIN_OWNER)
  updateOrgSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.service.updateOrgSettings(user, dto);
  }

  @Get('org/users')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  getOrgUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOrgUsers(user);
  }

  @Patch('org/users/:userId/role')
  @Roles(Role.ADMIN_OWNER)
  updateUserRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: { role: Role },
  ) {
    return this.service.updateUserRole(user, userId, dto);
  }

  @Post('org/users/:userId/suspend')
  @Roles(Role.ADMIN_OWNER)
  suspendUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.service.suspendUser(user, userId);
  }

  @Post('org/users/:userId/reactivate')
  @Roles(Role.ADMIN_OWNER)
  reactivateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.service.reactivateUser(user, userId);
  }
}
