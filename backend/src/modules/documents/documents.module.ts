import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentVersion } from '../../entities/document-version.entity';
import { QmsDocument } from '../../entities/document.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([QmsDocument, DocumentVersion])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
