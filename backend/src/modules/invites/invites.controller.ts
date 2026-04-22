import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AcceptInviteDto, CreateInviteDto } from './dto/invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly service: InvitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_OWNER, Role.SUPER_ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInviteDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_OWNER, Role.SUPER_ADMIN, Role.QUALITY_MANAGER)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN_OWNER, Role.SUPER_ADMIN)
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.revoke(user, id);
  }

  // Public endpoints for the accept-invite page.
  @Get('verify/:token')
  verify(@Param('token') token: string) {
    return this.service.verify(token);
  }

  @Post('accept')
  accept(@Body() dto: AcceptInviteDto) {
    return this.service.accept(dto);
  }
}
