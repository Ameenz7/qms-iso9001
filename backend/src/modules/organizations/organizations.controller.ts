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
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateOrganizationDto,
  RecordPaymentDto,
  SuspendOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  @Post(':id/suspend')
  suspend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuspendOrganizationDto,
  ) {
    return this.service.suspend(user, id, dto);
  }

  @Post(':id/unsuspend')
  unsuspend(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.unsuspend(user, id);
  }

  @Post(':id/payments')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.service.recordPayment(user, id, dto);
  }

  @Get(':id/payments')
  listPayments(@Param('id') id: string) {
    return this.service.listPayments(id);
  }
}
