import { Global, Logger, Module } from '@nestjs/common';
import { FILE_STORAGE, FileStorage, LocalDiskStorage } from './file-storage';
import { MinioStorage } from './minio-storage';

/**
 * Picks the backend impl of {@link FileStorage} at bootstrap based on the
 * STORAGE_DRIVER env var: "minio" | "s3" -> {@link MinioStorage},
 * anything else (default) -> {@link LocalDiskStorage}.
 */
function createFileStorage(): FileStorage {
  const driver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  const logger = new Logger('StorageModule');
  if (driver === 'minio' || driver === 's3') {
    logger.log(`Using MinIO/S3 storage driver (${driver})`);
    return new MinioStorage();
  }
  logger.log('Using local-disk storage driver');
  return new LocalDiskStorage();
}

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      useFactory: createFileStorage,
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
