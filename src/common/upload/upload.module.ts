// src/common/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { ImageStorageService } from './image-storage.service';

@Module({
  providers: [ImageStorageService],
  exports: [ImageStorageService], // This is crucial!
})
export class UploadModule {}