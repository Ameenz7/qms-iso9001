import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SharesService } from './shares.service';

/**
 * Public read-only access to documents via a share token.
 *
 * No JWT guard, no CSRF (all GET). Each route validates the token against
 * bcrypt, checks expiry + revocation, and enforces org-match on attachments.
 */
@Controller('public/shares')
export class PublicSharesController {
  constructor(private readonly service: SharesService) {}

  @Get(':token')
  get(@Param('token') token: string) {
    return this.service.resolvePublic(token);
  }

  @Get(':token/attachments/:attachmentId/download')
  async download(
    @Param('token') token: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { attachment, stream } = await this.service.openPublicAttachment(
      token,
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
}
