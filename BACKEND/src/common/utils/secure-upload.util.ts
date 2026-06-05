import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { memoryStorage } from 'multer';
import { extname, join, normalize } from 'path';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

const MIME_EXTENSION_MAP = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
} as const;

type AllowedMimeType = keyof typeof MIME_EXTENSION_MAP;
type MulterFile = Parameters<NonNullable<MulterOptions['fileFilter']>>[1];
type MulterCallback = Parameters<NonNullable<MulterOptions['fileFilter']>>[2];

export const IMAGE_UPLOAD_MIME_TYPES: AllowedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const DOCUMENT_UPLOAD_MIME_TYPES: AllowedMimeType[] = ['application/pdf'];

const FILE_SIGNATURES: Record<AllowedMimeType, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
  'application/pdf': [Buffer.from('%PDF-')],
};

const getAllowedExtensions = (mimeType: AllowedMimeType) =>
  MIME_EXTENSION_MAP[mimeType] ?? [];

const hasSignature = (buffer: Buffer, signature: Buffer, start = 0) =>
  buffer.subarray(start, start + signature.length).equals(signature);

const matchesMagicNumber = (buffer: Buffer, mimeType: AllowedMimeType) => {
  if (!buffer.length) {
    return false;
  }

  if (mimeType === 'image/webp') {
    return (
      hasSignature(buffer, FILE_SIGNATURES['image/webp'][0], 0) &&
      hasSignature(buffer, FILE_SIGNATURES['image/webp'][1], 8)
    );
  }

  return FILE_SIGNATURES[mimeType].some((signature) =>
    hasSignature(buffer, signature),
  );
};

const getSafeExtension = (originalName: string, mimeType: AllowedMimeType) => {
  const extension = extname(originalName).toLowerCase();
  const allowedExtensions = getAllowedExtensions(mimeType);

  if (!allowedExtensions.includes(extension as never)) {
    throw new UnsupportedMediaTypeException(
      `File extension ${extension || 'unknown'} is not allowed for ${mimeType}`,
    );
  }

  return extension;
};

export const buildSecureMulterOptions = (
  allowedMimeTypes: AllowedMimeType[],
  maxFileSizeBytes = 5 * 1024 * 1024,
): MulterOptions => ({
  storage: memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (_req: any, file: MulterFile, callback: MulterCallback) => {
    const mimeType = file.mimetype as AllowedMimeType;

    if (!allowedMimeTypes.includes(mimeType)) {
      return callback(
        new UnsupportedMediaTypeException(
          `Only ${allowedMimeTypes.join(', ')} file types are allowed`,
        ),
        false,
      );
    }

    try {
      getSafeExtension(file.originalname, mimeType);
      callback(null, true);
    } catch (error) {
      callback(error as Error, false);
    }
  },
});

export const assertSafeUploadedFile = (
  file: Express.Multer.File | undefined,
  allowedMimeTypes: AllowedMimeType[],
  maxFileSizeBytes = 5 * 1024 * 1024,
) => {
  if (!file) {
    throw new BadRequestException('Fayl yuborilishi shart');
  }

  if (!file.buffer?.length) {
    throw new BadRequestException("Fayl bo'sh yoki noto'g'ri formatda");
  }

  if (file.size > maxFileSizeBytes) {
    throw new PayloadTooLargeException(
      `Fayl hajmi ${Math.floor(maxFileSizeBytes / 1024 / 1024)}MB dan oshmasligi kerak`,
    );
  }

  const mimeType = file.mimetype as AllowedMimeType;

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new UnsupportedMediaTypeException(
      `Only ${allowedMimeTypes.join(', ')} file types are allowed`,
    );
  }

  getSafeExtension(file.originalname, mimeType);

  if (!matchesMagicNumber(file.buffer, mimeType)) {
    throw new UnsupportedMediaTypeException(
      "Faylning haqiqiy tarkibi ko'rsatilgan turga mos emas",
    );
  }
};

export const saveUploadedFile = async (
  file: Express.Multer.File,
  folder: string,
) => {
  const mimeType = file.mimetype as AllowedMimeType;
  const extension = getSafeExtension(file.originalname, mimeType);
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
  const destination = join(UPLOAD_ROOT, safeFolder);

  mkdirSync(destination, { recursive: true });

  const filename = `${randomUUID()}${extension}`;
  const absolutePath = join(destination, filename);

  await writeFile(absolutePath, file.buffer, { flag: 'wx' });

  return `${safeFolder}/${filename}`.replace(/\\/g, '/');
};

export const deleteStoredFile = async (relativePath: string) => {
  const normalizedPath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = join(UPLOAD_ROOT, normalizedPath);

  await unlink(absolutePath).catch(() => undefined);
};
