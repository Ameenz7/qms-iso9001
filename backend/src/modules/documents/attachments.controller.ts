import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttachmentsService } from './attachments.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}

  @Get(':id/attachments')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.list(user, id);
  }

  @Post(':id/attachments')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(user, id, file);
  }

  @Get('attachments/:attachmentId/download')
  @Roles(Role.ADMIN_OWNER, Role.QUALITY_MANAGER, Role.EMPLOYEE)
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { attachment, stream } = await this.service.getForDownload(
      user,
      attachmentId,
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.filename.replace(/"/g, '')}"`,
    );
    res.setHeader('Content-Length', attachment.size);
    res.setHeader('X-Content-SHA-256', attachment.sha256);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
      else res.end();
    });
    stream.pipe(res);
  }

  @Delete('attachments/:attachmentId')
  @Roles(Role.ADMIN_OWNER)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.remove(user, attachmentId);
  }
}
