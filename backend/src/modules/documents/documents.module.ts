import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentAttachment } from '../../entities/document-attachment.entity';
import { DocumentShare } from '../../entities/document-share.entity';
import { DocumentVersion } from '../../entities/document-version.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PublicSharesController } from './public-shares.controller';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QmsDocument,
      DocumentVersion,
      DocumentAttachment,
      DocumentShare,
    ]),
  ],
  controllers: [
    AttachmentsController,
    SharesController,
    PublicSharesController,
    DocumentsController,
  ],
  providers: [DocumentsService, AttachmentsService, SharesService],
})
export class DocumentsModule {}
