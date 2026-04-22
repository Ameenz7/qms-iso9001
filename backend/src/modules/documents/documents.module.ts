import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentAttachment } from '../../entities/document-attachment.entity';
import { DocumentVersion } from '../../entities/document-version.entity';
import { QmsDocument } from '../../entities/document.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QmsDocument, DocumentVersion, DocumentAttachment]),
  ],
  controllers: [AttachmentsController, DocumentsController],
  providers: [DocumentsService, AttachmentsService],
})
export class DocumentsModule {}
