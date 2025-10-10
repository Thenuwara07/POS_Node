import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

@Injectable()
export class ImageStorageService {
  /**
   * Saves a Base64 data URL like "data:image/png;base64,...."
   * Returns a relative path like "uploads/items/2025/10/<file>.png"
   */
  saveBase64ItemImage(dataUrl: string): string {
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
    if (!match) throw new BadRequestException('Invalid base64 image data URL');

    const mime = match[1];
    const ext = mime.endsWith('png')
      ? '.png'
      : mime.includes('webp')
      ? '.webp'
      : '.jpg';
    const b64 = match[3];

    const now = new Date();
    const relDir = join('uploads', 'items', `${now.getFullYear()}`, `${(now.getMonth() + 1).toString().padStart(2, '0')}`);
    const absDir = join(process.cwd(), relDir);
    if (!existsSync(absDir)) mkdirSync(absDir, { recursive: true });

    const filename = `${Date.now().toString(36)}${ext}`;
    const absPath = join(absDir, filename);
    writeFileSync(absPath, Buffer.from(b64, 'base64'), { flag: 'w' });

    return join(relDir, filename).replace(/\\/g, '/');
  }
}
