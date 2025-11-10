import { Module } from '@nestjs/common';
import { ImageStorageService } from './image-storage.service';

@Module({
  providers: [ImageStorageService],
  exports: [ImageStorageService],
})
export class UploadModule {}
