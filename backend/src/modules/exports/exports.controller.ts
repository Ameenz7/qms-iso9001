import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @Get(':module/csv')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('module') mod: string,
    @Res() res: Response,
  ) {
    let rows;
    switch (mod) {
      case 'non-conformities':
        rows = await this.service.exportNcs(user);
        break;
      case 'capas':
        rows = await this.service.exportCapas(user);
        break;
      case 'documents':
        rows = await this.service.exportDocuments(user);
        break;
      case 'audits':
        rows = await this.service.exportAudits(user);
        break;
      case 'audit-logs':
        rows = await this.service.exportAuditLogs(user);
        break;
      default:
        res.status(400).json({ message: `Unknown module: ${mod}` });
        return;
    }

    const csv = this.service.toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${mod}-export-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Get(':module/json')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.AUDITOR)
  async exportJson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('module') mod: string,
  ) {
    switch (mod) {
      case 'non-conformities':
        return this.service.exportNcs(user);
      case 'capas':
        return this.service.exportCapas(user);
      case 'documents':
        return this.service.exportDocuments(user);
      case 'audits':
        return this.service.exportAudits(user);
      case 'audit-logs':
        return this.service.exportAuditLogs(user);
      default:
        return { message: `Unknown module: ${mod}` };
    }
  }
}
