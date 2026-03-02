// Image validation and processing pipeline
// Checks: file type, file size, minimum resolution
// Converts: resizes to max 2048px on longest edge, compresses to JPEG quality 85
// Source: Implementation Spec §IX, constants in lib/config/constants.ts

import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_DIMENSION,
  JPEG_QUALITY,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
} from '@/lib/config/constants';

export type ImageValidationResult =
  | { valid: true; processedBase64: string; mimeType: string }
  | { valid: false; reason: string };

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

function calculateTargetDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }
  const scale = MAX_IMAGE_DIMENSION / longestEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for dimension check'));
    img.src = dataUrl;
  });
}

async function processFile(file: File): Promise<ImageValidationResult> {
  // 1. Check MIME type
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      return {
        valid: false,
        reason:
          'HEIC/HEIF format is not supported. On iPhone, go to Settings → Camera → Formats → Most Compatible to capture in JPEG.',
      };
    }
    return {
      valid: false,
      reason: `Unsupported file type "${file.type || 'unknown'}". Please upload a JPEG, PNG, or WEBP image.`,
    };
  }

  // 2. Check file size
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      reason: `File is too large (${sizeMB} MB). Maximum size is 20 MB.`,
    };
  }

  // 3. Read file as data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // 4. Load into Image element to get natural dimensions
  const img = await loadImage(dataUrl);

  // 5. Check minimum dimensions
  if (img.naturalWidth < MIN_IMAGE_WIDTH || img.naturalHeight < MIN_IMAGE_HEIGHT) {
    return {
      valid: false,
      reason: `Image too small (${img.naturalWidth}×${img.naturalHeight}px). Minimum is ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px. Move closer to the comic and retake the photo.`,
    };
  }

  // 6. Determine output dimensions
  const { width, height } = calculateTargetDimensions(
    img.naturalWidth,
    img.naturalHeight,
  );

  // 7. Draw to canvas and compress to JPEG
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { valid: false, reason: 'Canvas rendering is not available in this browser.' };
  }
  ctx.drawImage(img, 0, 0, width, height);

  const outputDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY / 100);
  const base64 = outputDataUrl.replace(/^data:image\/jpeg;base64,/, '');

  return { valid: true, processedBase64: base64, mimeType: 'image/jpeg' };
}

async function processBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<ImageValidationResult> {
  // Server-side path: validate type and size only (no canvas resizing available)
  const normalizedMime = mimeType.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return {
      valid: false,
      reason: `Unsupported file type "${mimeType}". Allowed: JPEG, PNG, WEBP.`,
    };
  }
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      reason: `File too large (${sizeMB} MB). Maximum is 20 MB.`,
    };
  }
  return {
    valid: true,
    processedBase64: buffer.toString('base64'),
    mimeType: normalizedMime,
  };
}

/**
 * Validate and process an image for the appraisal pipeline.
 *
 * Browser (File): checks type/size/resolution, resizes to max 2048px, compresses
 * to JPEG at quality 85, returns base64-encoded JPEG.
 *
 * Server (Buffer): checks type and size only (no canvas available); returns
 * original bytes as base64. Caller is responsible for resizing if needed.
 */
export async function validateAndProcessImage(
  file: File | Buffer,
  mimeType: string,
): Promise<ImageValidationResult> {
  if (typeof window !== 'undefined' && file instanceof File) {
    return processFile(file);
  }
  if (Buffer.isBuffer(file)) {
    return processBuffer(file, mimeType);
  }
  return { valid: false, reason: 'Invalid input: expected a File or Buffer.' };
}
