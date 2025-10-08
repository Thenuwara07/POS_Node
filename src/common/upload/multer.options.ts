import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export function itemImageMulterOptions() {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const now = new Date();
        const dir = join(
          process.cwd(),
          'uploads',
          'items',
          `${now.getFullYear()}`,
          `${(now.getMonth() + 1).toString().padStart(2, '0')}`
        );
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const base = Date.now().toString(36);
        const ext = extname(file.originalname)?.toLowerCase() || '.png';
        cb(null, `${base}${ext}`);
      },
    }),
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
      if (!/image\/(png|jpe?g|webp)/i.test(file.mimetype)) {
        return cb(new Error('Only image files (png, jpg, jpeg, webp) are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  };
}
