import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE, LocalDiskStorage } from './file-storage';

@Global()
@Module({
  providers: [
    LocalDiskStorage,
    { provide: FILE_STORAGE, useExisting: LocalDiskStorage },
  ],
  exports: [FILE_STORAGE, LocalDiskStorage],
})
export class StorageModule {}
