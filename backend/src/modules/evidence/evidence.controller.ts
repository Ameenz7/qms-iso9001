import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { EvidenceService } from './evidence.service';
import { EvidenceEntityType } from '../../common/enums/evidence-type.enum';
import { FILE_STORAGE, FileStorage } from '../storage/file-storage';
import { Readable } from 'stream';
import { createHash } from 'crypto';

@Controller('evidences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(
    private readonly service: EvidenceService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('entityId') entityId: string,
    @Query('entityType') entityType: EvidenceEntityType,
  ) {
    // 1. Calculate hash
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // 2. Upload to storage
    const stream = Readable.from(file.buffer);
    const stored = await this.storage.save(
      user.organizationId!,
      file.originalname,
      stream as any,
      hash,
      file.size,
    );

    // 3. Save record in DB
    return this.service.create(user, {
      entityId,
      entityType,
      fileUrl: stored.storageKey,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });
  }

  @Get()
  list(
    @Query('entityId') entityId: string,
    @Query('entityType') entityType: EvidenceEntityType,
  ) {
    return this.service.listForEntity(entityId, entityType);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const evidence = await this.service.findOne(id, user);
    const stream = this.storage.openRead(evidence.fileUrl);
    
    res.setHeader('Content-Type', evidence.fileType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${evidence.fileName}"`,
    );
    
    stream.pipe(res);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }
}
