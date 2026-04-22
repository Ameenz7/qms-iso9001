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
import { CreateShareDto } from './dto/share.dto';
import { SharesService } from './shares.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SharesController {
  constructor(private readonly service: SharesService) {}

  @Get(':id/shares')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.listForDocument(user, id);
  }

  @Post(':id/shares')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.service.create(user, id, dto);
  }

  @Delete('shares/:id')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER)
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.revoke(user, id);
  }
}
