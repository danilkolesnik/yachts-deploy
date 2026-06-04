import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

/** 500 MB — enough for typical field videos */
export const MEDIA_UPLOAD_MAX_BYTES = 500 * 1024 * 1024;

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.webm',
  '.avi',
  '.mkv',
  '.m4v',
  '.mpeg',
  '.mpg',
  '.3gp',
]);

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
  '.bmp',
]);

export function getUploadsRoot(): string {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured) {
    return configured;
  }
  const dockerDefault = '/app/uploads';
  if (existsSync(dockerDefault)) {
    return dockerDefault;
  }
  const local = join(process.cwd(), 'uploads');
  if (!existsSync(local)) {
    mkdirSync(local, { recursive: true });
  }
  return local;
}

export function detectMediaKind(
  mimetype: string,
  originalname: string,
): 'image' | 'video' | null {
  const mt = (mimetype || '').toLowerCase().split(';')[0].trim();
  if (mt.startsWith('image/')) {
    return 'image';
  }
  if (mt.startsWith('video/')) {
    return 'video';
  }
  if (mt === 'application/mp4' || mt === 'application/x-mp4') {
    return 'video';
  }

  const ext = extname(originalname || '').toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) {
    return 'video';
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return 'image';
  }
  return null;
}

export function ensureMediaSubdirs(root: string) {
  for (const sub of ['image', 'video', 'logo']) {
    const dir = join(root, sub);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function mediaUploadDestination() {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) => {
    const kind = detectMediaKind(file.mimetype, file.originalname);
    const root = getUploadsRoot();
    ensureMediaSubdirs(root);

    let folder = root;
    if (kind === 'image') {
      folder = join(root, 'image');
    } else if (kind === 'video') {
      folder = join(root, 'video');
    }

    callback(null, folder);
  };
}

export function mediaUploadFilename() {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '';
    callback(null, `${uniqueSuffix}${ext}`);
  };
}

export function createMediaUploadOptions() {
  return {
    storage: diskStorage({
      destination: mediaUploadDestination(),
      filename: mediaUploadFilename(),
    }),
    limits: { fileSize: MEDIA_UPLOAD_MAX_BYTES },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const kind = detectMediaKind(file.mimetype, file.originalname);
      if (!kind) {
        cb(
          new Error(
            'Unsupported file type. Upload images (jpg, png, …) or videos (mp4, mov, …).',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

export function getPublicMediaUrl(
  filename: string,
  kind: 'image' | 'video',
): string {
  const base = (process.env.SERVER_URL || 'http://localhost:5000').replace(
    /\/$/,
    '',
  );
  const folder = kind === 'image' ? 'image' : 'video';
  const url = `${base}/uploads/${folder}/${filename}`;
  return url.replace(/([^:]\/)\/+/g, '$1');
}
