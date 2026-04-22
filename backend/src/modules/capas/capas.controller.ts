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

@Controller('capas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CapasController {
  constructor(private readonly service: CapasService) {}

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
}
