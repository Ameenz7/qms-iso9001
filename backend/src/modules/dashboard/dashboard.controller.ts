import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR, Role.EMPLOYEE)
  kpis(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getKpis(user);
  }

  @Get('charts')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  charts(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getChartData(user);
  }

  @Get('tasks')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR, Role.EMPLOYEE)
  tasks(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyTasks(user);
  }
}
